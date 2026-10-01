import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Init Google GenAI if key available
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const serverNvidiaKey = process.env.NVIDIA_API_KEY || '';

const ai = geminiApiKey
  ? new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Endpoint: Check server status and provider keys
app.get('/api/config', (_req: Request, res: Response) => {
  res.json({
    hasGeminiKey: Boolean(geminiApiKey),
    hasServerNvidiaKey: Boolean(serverNvidiaKey),
    serverNvidiaKeyPreview: serverNvidiaKey ? `${serverNvidiaKey.slice(0, 7)}...${serverNvidiaKey.slice(-4)}` : null,
  });
});

// Endpoint: Verify NVIDIA API Key and fetch accessible models
app.post('/api/nvidia/verify', async (req: Request, res: Response) => {
  const apiKey = (req.body.apiKey || serverNvidiaKey || '').trim();

  if (!apiKey) {
    return res.status(400).json({
      valid: false,
      error: 'No NVIDIA API key provided. Please input an API key starting with nvapi-...',
    });
  }

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      let message = `NVIDIA API error (${response.status})`;
      try {
        const errJson = JSON.parse(errText);
        message = errJson.message || errJson.detail || message;
      } catch {
        message = errText || message;
      }
      return res.status(response.status).json({
        valid: false,
        error: message,
      });
    }

    const data = await response.json();
    return res.json({
      valid: true,
      models: data.data || [],
      message: 'NVIDIA API key verified successfully!',
    });
  } catch (error: any) {
    return res.status(500).json({
      valid: false,
      error: error.message || 'Failed to connect to NVIDIA API endpoint',
    });
  }
});

// Helper to execute non-streaming completion for study generators
async function callLLMText(opts: {
  provider: string;
  model: string;
  systemInstruction?: string;
  prompt: string;
  nvidiaApiKey?: string;
}): Promise<string> {
  const { provider, model, systemInstruction, prompt, nvidiaApiKey } = opts;

  if (provider === 'nvidia') {
    const activeKey = (nvidiaApiKey || serverNvidiaKey || '').trim();
    if (!activeKey) {
      throw new Error('NVIDIA API Key not configured. Please add your key in Settings.');
    }

    const messages = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${activeKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'meta/llama-3.3-70b-instruct',
        messages,
        temperature: 0.3,
        max_tokens: 3000,
        stream: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`NVIDIA API error: ${err}`);
    }

    const json = await response.json();
    return json.choices?.[0]?.message?.content || '';
  }

  // Gemini provider
  if (!ai) {
    throw new Error('Gemini API is not configured on the server.');
  }

  try {
    const result = await ai.models.generateContent({
      model: model || 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || undefined,
        temperature: 0.3,
      },
    });

    return result.text || '';
  } catch (err: any) {
    if (err.message?.includes('503') || err.message?.includes('UNAVAILABLE') || err.message?.includes('high demand')) {
      // Brief pause and retry once
      await new Promise((r) => setTimeout(r, 1200));
      const retryResult = await ai.models.generateContent({
        model: model || 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || undefined,
          temperature: 0.3,
        },
      });
      return retryResult.text || '';
    }
    throw err;
  }
}

// Helper to parse JSON from LLM response safely
function extractJSON(rawText: string) {
  let cleaned = rawText.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  cleaned = cleaned.trim();

  // Try parsing directly
  try {
    return JSON.parse(cleaned);
  } catch {
    // Attempt to locate first { or [ to last } or ]
    const firstBrace = cleaned.search(/[{\[]/);
    const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const sub = cleaned.substring(firstBrace, lastBrace + 1);
      return JSON.parse(sub);
    }
    throw new Error('Unable to extract valid JSON from model response.');
  }
}

// Endpoint: AI Study Buddy - Generate Flashcards
app.post('/api/study/flashcards', async (req: Request, res: Response) => {
  const { topic, count = 6, provider = 'nvidia', model, nvidiaApiKey } = req.body;

  if (!topic || !topic.trim()) {
    return res.status(400).json({ error: 'Topic is required.' });
  }

  const prompt = `Generate a set of ${count} high-yield study flashcards for the topic: "${topic}".
Return ONLY a valid JSON array of objects with the exact schema:
[
  {
    "id": "1",
    "question": "Clear, focused question testing a core concept",
    "answer": "Accurate, concise, authoritative answer",
    "hint": "Subtle mnemonic or clue",
    "topic": "${topic}"
  }
]
Do NOT include any markdown formatting, preamble, or conversational commentary. Return pure JSON.`;

  try {
    const raw = await callLLMText({
      provider,
      model,
      systemInstruction: 'You are an elite academic tutor creating high-yield active recall flashcards. Always respond with pure valid JSON only.',
      prompt,
      nvidiaApiKey,
    });

    const parsed = extractJSON(raw);
    const cards = Array.isArray(parsed) ? parsed : parsed.cards || [];
    return res.json({ cards });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to generate flashcards.' });
  }
});

// Endpoint: AI Study Buddy - Generate Practice Quiz
app.post('/api/study/quiz', async (req: Request, res: Response) => {
  const { topic, count = 5, difficulty = 'Medium', provider = 'nvidia', model, nvidiaApiKey } = req.body;

  if (!topic || !topic.trim()) {
    return res.status(400).json({ error: 'Topic is required.' });
  }

  const prompt = `Generate a ${difficulty}-level multiple-choice quiz of ${count} questions testing understanding of: "${topic}".
Return ONLY a valid JSON array of question objects with the exact schema:
[
  {
    "id": "q1",
    "question": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Clear explanation of why this answer is correct and why other choices are traps or incorrect."
  }
]
Ensure correctIndex is an integer 0, 1, 2, or 3 corresponding to the correct option. Do NOT include markdown fences, preamble, or extra text.`;

  try {
    const raw = await callLLMText({
      provider,
      model,
      systemInstruction: 'You are an expert test creator constructing rigorous multiple choice quizzes. Return pure JSON only.',
      prompt,
      nvidiaApiKey,
    });

    const parsed = extractJSON(raw);
    const questions = Array.isArray(parsed) ? parsed : parsed.questions || [];
    return res.json({ questions });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to generate quiz questions.' });
  }
});

// Main Chat Streaming API endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  const {
    provider = 'nvidia',
    model,
    messages = [],
    temperature = 0.7,
    maxTokens = 4096,
    nvidiaApiKey,
    systemInstruction,
  } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendSSE = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // 1. Handle NVIDIA NIM API
  if (provider === 'nvidia') {
    const activeApiKey = (nvidiaApiKey || serverNvidiaKey || '').trim();

    if (!activeApiKey) {
      sendSSE({
        error: 'NVIDIA API Key not found. Please click the Settings gear icon or Key icon in the top bar and enter your NVIDIA API key (nvapi-...).',
        done: true,
      });
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const targetModel = model || 'meta/llama-3.3-70b-instruct';

    // Format messages for NVIDIA NIM
    const formattedMessages: Array<{ role: string; content: string }> = [];
    if (systemInstruction && systemInstruction.trim()) {
      formattedMessages.push({ role: 'system', content: systemInstruction.trim() });
    }

    for (const msg of messages) {
      formattedMessages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content || '',
      });
    }

    try {
      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeApiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          model: targetModel,
          messages: formattedMessages,
          temperature: typeof temperature === 'number' ? temperature : 0.7,
          max_tokens: typeof maxTokens === 'number' ? maxTokens : 4096,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `NVIDIA API responded with status ${response.status}`;
        try {
          const parsed = JSON.parse(errorText);
          errorMsg = parsed.message || parsed.detail || parsed.error?.message || errorMsg;
        } catch {
          errorMsg = errorText || errorMsg;
        }
        sendSSE({ error: errorMsg, done: true });
        res.write('data: [DONE]\n\n');
        return res.end();
      }

      if (!response.body) {
        sendSSE({ error: 'No response body stream received from NVIDIA', done: true });
        res.write('data: [DONE]\n\n');
        return res.end();
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === '[DONE]') {
            sendSSE({ done: true });
            continue;
          }

          try {
            const parsed = JSON.parse(dataStr);
            const choice = parsed.choices?.[0];
            if (choice) {
              const delta = choice.delta || {};
              // DeepSeek-R1 and reasoning models return reasoning_content or <think>
              const reasoningChunk = delta.reasoning_content || '';
              const contentChunk = delta.content || '';

              if (reasoningChunk || contentChunk) {
                sendSSE({
                  content: contentChunk,
                  reasoning: reasoningChunk,
                  done: false,
                });
              }
            }
          } catch {
            // Ignore parse errors on partial frames
          }
        }
      }

      sendSSE({ done: true });
      res.write('data: [DONE]\n\n');
      return res.end();
    } catch (err: any) {
      sendSSE({
        error: `Error communicating with NVIDIA API: ${err.message || 'Unknown network error'}`,
        done: true,
      });
      res.write('data: [DONE]\n\n');
      return res.end();
    }
  }

  // 2. Handle Gemini API (built-in full-stack provider)
  if (provider === 'gemini') {
    if (!ai) {
      sendSSE({
        error: 'Gemini API is not configured on the server. Please verify GEMINI_API_KEY in server secrets.',
        done: true,
      });
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const targetModel = model || 'gemini-3.8-flash';

    try {
      // Build conversation contents
      const contents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content || '' }],
      }));

      const config: any = {
        temperature: typeof temperature === 'number' ? temperature : 0.7,
      };

      if (systemInstruction && systemInstruction.trim()) {
        config.systemInstruction = systemInstruction.trim();
      }

      const streamResponse = await ai.models.generateContentStream({
        model: targetModel,
        contents,
        config,
      });

      for await (const chunk of streamResponse) {
        const text = chunk.text;
        if (text) {
          sendSSE({
            content: text,
            done: false,
          });
        }
      }

      sendSSE({ done: true });
      res.write('data: [DONE]\n\n');
      return res.end();
    } catch (err: any) {
      let friendlyError = err.message || 'Generation failed';
      if (friendlyError.includes('503') || friendlyError.includes('high demand') || friendlyError.includes('UNAVAILABLE')) {
        friendlyError = 'The Gemini model is currently experiencing temporary high demand upstream. Please retry in a moment, or switch to an NVIDIA NIM model.';
      }
      sendSSE({
        error: `Gemini API: ${friendlyError}`,
        done: true,
      });
      res.write('data: [DONE]\n\n');
      return res.end();
    }
  }

  // Unknown provider
  sendSSE({ error: `Unsupported provider: ${provider}`, done: true });
  res.write('data: [DONE]\n\n');
  return res.end();
});

// Setup Vite dev server or static files
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NexusAI Server running on port ${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
