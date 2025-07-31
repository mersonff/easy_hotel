import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { EventConsumer } from './event-consumer';

dotenv.config();

const app: Express = express();
const PORT: string = process.env.PORT || '3005';

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Notifications Service',
    version: '1.0.0'
  });
});

// Rotas básicas
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Easy Hotel - Notifications Service',
    version: '1.0.0'
  });
});

// Inicializar consumer de eventos
const eventConsumer = new EventConsumer();

app.listen(PORT, async () => {
  console.log(`🚀 Serviço de Notificações rodando na porta ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  
  try {
    await eventConsumer.start();
    console.log('✅ Consumer de eventos iniciado');
  } catch (error) {
    console.error('❌ Erro ao iniciar consumer de eventos:', error);
  }
});

export default app; 