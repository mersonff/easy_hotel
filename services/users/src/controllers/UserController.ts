import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { AuthMiddleware } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validation';
import { CreateUserSchema, UpdateUserSchema, LoginSchema, UserIdSchema } from '../schemas/UserSchemas';

export class UserController {
  private userService: UserService;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.userService = new UserService();
    this.authMiddleware = new AuthMiddleware();
  }

  // Health check
  health = (req: Request, res: Response) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Users Service',
      version: '1.0.0'
    });
  };

  // Informações do serviço
  info = (req: Request, res: Response) => {
    res.json({
      message: 'Easy Hotel - Users Service',
      version: '1.0.0',
      endpoints: {
        'POST /auth/register': 'Registrar novo usuário',
        'POST /auth/login': 'Fazer login',
        'GET /users': 'Listar usuários (admin)',
        'GET /users/:id': 'Buscar usuário',
        'PUT /users/:id': 'Atualizar usuário',
        'DELETE /users/:id': 'Deletar usuário (admin)',
        'GET /auth/me': 'Obter dados do usuário logado'
      }
    });
  };

  // Registrar novo usuário
  register = async (req: Request, res: Response) => {
    try {
      const user = await this.userService.createUser(req.body);
      
      res.status(201).json({
        message: 'Usuário criado com sucesso',
        user
      });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Erro ao criar usuário'
      });
    }
  };

  // Login
  login = async (req: Request, res: Response) => {
    try {
      const result = await this.userService.login(req.body);
      
      res.json({
        message: 'Login realizado com sucesso',
        ...result
      });
    } catch (error) {
      res.status(401).json({
        error: error instanceof Error ? error.message : 'Erro no login'
      });
    }
  };

  // Obter dados do usuário logado
  getMe = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const user = await this.userService.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      return res.json({
        message: 'Dados do usuário obtidos com sucesso',
        user
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Erro ao obter dados do usuário'
      });
    }
  };

  // Listar todos os usuários (apenas admin)
  getAllUsers = async (req: Request, res: Response) => {
    try {
      const users = await this.userService.getAllUsers();
      
      return res.json({
        message: 'Usuários listados com sucesso',
        users,
        total: users.length
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Erro ao listar usuários'
      });
    }
  };

  // Buscar usuário por ID
  getUserById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      return res.json({
        message: 'Usuário encontrado com sucesso',
        user
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Erro ao buscar usuário'
      });
    }
  };

  // Atualizar usuário
  updateUser = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const user = await this.userService.updateUser(id, updateData);
      
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      return res.json({
        message: 'Usuário atualizado com sucesso',
        user
      });
    } catch (error) {
      return res.status(400).json({
        error: error instanceof Error ? error.message : 'Erro ao atualizar usuário'
      });
    }
  };

  // Deletar usuário (soft delete)
  deleteUser = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await this.userService.deleteUser(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      return res.json({
        message: 'Usuário deletado com sucesso'
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Erro ao deletar usuário'
      });
    }
  };

  // Middleware de autenticação
  get authenticate() {
    return this.authMiddleware.authenticate;
  }

  // Middleware para verificar roles
  requireRole(roles: string[]) {
    return this.authMiddleware.requireRole(roles);
  }

  // Middleware para verificar ownership
  get requireOwnershipOrAdmin() {
    return this.authMiddleware.requireOwnershipOrAdmin;
  }

  // Middleware de validação
  get validateCreateUser() {
    return validateBody(CreateUserSchema);
  }

  get validateUpdateUser() {
    return validateBody(UpdateUserSchema);
  }

  get validateLogin() {
    return validateBody(LoginSchema);
  }

  get validateUserId() {
    return validateParams(UserIdSchema);
  }
} 