import pino from 'pino';
import { KiachaCoreBrain } from './core-brain.js';
import { WebSocketServer, WebSocket } from 'ws';
import express, { Request, Response } from 'express';
import appsRouter, { setKernelClient } from './routes/apps.js';
import reasoningRouter, { initializeReasoning } from './routes/reasoning.js';
import toolsRouter, { initializeTools } from './routes/tools.js';
import eventsRouter, { initializeEventBus } from './routes/events.js';
import memoryRouter from './routes/memory.js';

const logger = pino({ level: 'info' });

const app = express();
const PORT = 3001;
const WS_PORT = 3002;
const KERNEL_ADDRESS = process.env.KERNEL_ADDRESS || 'localhost:50051';

app.use(express.json());

// Mount routers
app.use('/api', appsRouter);
app.use('/api/reasoning', reasoningRouter);
app.use('/api/tools', toolsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/memory', memoryRouter);

// Initialize brain with kernel connection
const brain = new KiachaCoreBrain(KERNEL_ADDRESS);

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down...');
  brain.disconnect();
  process.exit(0);
});

// REST API endpoints
app.post('/api/infer', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    const result = await brain.infer(prompt);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post('/api/reason', async (req: Request, res: Response) => {
  try {
    const { task } = req.body;
    const result = await brain.reason(task);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/memory/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    const results = await brain.memory.search(query as string);
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/status', async (req: Request, res: Response) => {
  try {
    const status = await brain.getModuleStatus();
    res.json({ status: 'running', modules: status });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/kernel/resources', async (req: Request, res: Response) => {
  try {
    const resources = await brain.getKernelResources();
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Initialize the brain and start server
(async () => {
  try {
    logger.info('🧠 Connecting to Kiacha Kernel...');
    await brain.connect();
    logger.info('✓ Brain connected to kernel');

    // Set kernel client for all routes
    setKernelClient(brain.kernelClient);
    await initializeReasoning(brain.kernelClient);
    await initializeTools(brain.kernelClient);
    await initializeEventBus(null, brain.kernelClient);
    
    logger.info('✓ Cognitive modules initialized');
    logger.info('  - Reasoning Engine (WASM)')
    logger.info('  - Tool Use Engine (30+ tools)')
    logger.info('  - Cognitive Event Bus')
    logger.info('  - Semantic Memory');

    // WebSocket server for real-time communication
    const wss = new WebSocketServer({ port: WS_PORT });

    wss.on('connection', (ws: WebSocket) => {
      logger.info('UI Client connected');

      ws.on('message', async (data: Buffer) => {
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
          } else if (message.type === 'kernel_resources') {
            const resources = await brain.getKernelResources();
            ws.send(JSON.stringify({ type: 'kernel_resources', resources }));
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

    app.listen(PORT, () => {
      logger.info(`🧠 Kiacha Core Brain API listening on port ${PORT}`);
    });

    logger.info(`🌐 WebSocket server listening on port ${WS_PORT}`);
    logger.info(`✓ Kiacha Core Brain is running!`);
  } catch (error) {
    logger.error({ error }, 'Failed to start Kiacha Brain');
    process.exit(1);
  }
})();
