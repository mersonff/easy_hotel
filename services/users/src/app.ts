import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { UserController } from './controllers/UserController';
import { prisma } from './lib/prisma';

dotenv.config();

const app: Express = express();
const PORT: string = process.env.PORT || '3003';

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Instanciar controller
const userController = new UserController();

// Health check
app.get('/health', userController.health);

// Informações do serviço
app.get('/', userController.info);

// Rotas de autenticação (públicas)
app.post('/auth/register', userController.validateCreateUser, userController.register);
app.post('/auth/login', userController.validateLogin, userController.login);

// Rotas protegidas
app.get('/auth/me', userController.authenticate, userController.getMe);

// Rotas de usuários (protegidas)
app.get('/users', userController.authenticate, userController.requireRole(['ADMIN']), userController.getAllUsers);
app.get('/users/:id', userController.authenticate, userController.validateUserId, userController.requireOwnershipOrAdmin, userController.getUserById);
app.put('/users/:id', userController.authenticate, userController.validateUserId, userController.validateUpdateUser, userController.requireOwnershipOrAdmin, userController.updateUser);
app.delete('/users/:id', userController.authenticate, userController.validateUserId, userController.requireRole(['ADMIN']), userController.deleteUser);

// Middleware de erro
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    error: 'Erro interno do servidor'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Inicializar banco e depois iniciar servidor
async function startServer() {
  try {
    // Conectar ao banco
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados');
    
    app.listen(PORT, () => {
      console.log(`🚀 Serviço de Usuários rodando na porta ${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 Documentação: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
}

startServer();

export default app; 