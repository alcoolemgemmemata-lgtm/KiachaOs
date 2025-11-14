import pino from 'pino';
import { KiachaCoreBrain } from './core-brain.js';
import { WebSocketServer } from 'ws';
import express from 'express';

const logger = pino({ level: 'info' });

const app = express();
const PORT = 3001;
const WS_PORT = 3002;

app.use(express.json());

const brain = new KiachaCoreBrain();

// REST API endpoints
app.post('/api/infer', async (req, res) => {
  try {
    const { prompt } = req.body;
    const result = await brain.infer(prompt);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post('/api/reason', async (req, res) => {
  try {
    const { task } = req.body;
    const result = await brain.reason(task);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/memory/search', async (req, res) => {
  try {
    const { query } = req.query;
    const results = await brain.memory.search(query as string);
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'running', modules: brain.getModuleStatus() });
});

app.listen(PORT, () => {
  logger.info(`🧠 Kiacha Core Brain API listening on port ${PORT}`);
});

// WebSocket server for real-time communication
const wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', (ws) => {
  logger.info('UI Client connected');

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      logger.debug(`Received message: ${message.type}`);

      if (message.type === 'infer') {
        const result = await brain.infer(message.prompt);
        ws.send(JSON.stringify({ type: 'infer_result', result }));
      } else if (message.type === 'vision') {
        const result = await brain.vision(message.imageData);
        ws.send(JSON.stringify({ type: 'vision_result', result }));
      } else if (message.type === 'audio_transcribe') {
        const result = await brain.audio.transcribe(message.audioData);
        ws.send(JSON.stringify({ type: 'transcribe_result', result }));
      } else if (message.type === 'audio_speak') {
        const audioData = await brain.audio.speak(message.text);
        ws.send(JSON.stringify({ type: 'speak_result', audioData }));
      }
    } catch (error) {
      logger.error(error);
      ws.send(JSON.stringify({ type: 'error', message: error instanceof Error ? error.message : 'Unknown error' }));
    }
  });

  ws.on('close', () => {
    logger.info('Client disconnected');
  });
});

logger.info(`🌐 WebSocket server listening on port ${WS_PORT}`);
logger.info(`✓ Kiacha Core Brain is running!`);
