import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { UserController } from '../controllers/UserController';
import { UserService } from '../services/UserService';

// Mock do UserService
vi.mock('../services/UserService');

describe('UserController', () => {
  let userController: UserController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    userController = new UserController();
    mockRequest = {
      body: {},
      params: {},
      headers: {},
      user: undefined
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
  });

  describe('health', () => {
    it('deve retornar status OK', () => {
      userController.health(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'OK',
        timestamp: expect.any(String),
        service: 'Users Service',
        version: '1.0.0'
      });
    });
  });

  describe('info', () => {
    it('deve retornar informações do serviço', () => {
      userController.info(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
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
    });
  });

  describe('register', () => {
    it('deve registrar usuário com sucesso', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: '123456'
      };

      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'guest',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.body = userData;

      // Mock do createUser
      vi.mocked(UserService.prototype.createUser).mockResolvedValue(mockUser);

      await userController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Usuário criado com sucesso',
        user: mockUser
      });
    });

    it('deve falhar com dados inválidos', async () => {
      const userData = {
        name: 'A',
        email: 'invalid-email',
        password: '123'
      };

      mockRequest.body = userData;

      // Mock do createUser para lançar erro
      vi.mocked(UserService.prototype.createUser).mockRejectedValue(
        new Error('Nome deve ter pelo menos 2 caracteres')
      );

      await userController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Nome deve ter pelo menos 2 caracteres'
      });
    });
  });

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      const loginData = {
        email: 'test@example.com',
        password: '123456'
      };

      const mockResult = {
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'guest'
        },
        token: 'mock-token',
        refreshToken: 'mock-refresh-token'
      };

      mockRequest.body = loginData;

      // Mock do login
      vi.mocked(UserService.prototype.login).mockResolvedValue(mockResult);

      await userController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Login realizado com sucesso',
        ...mockResult
      });
    });

    it('deve falhar com credenciais inválidas', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrong-password'
      };

      mockRequest.body = loginData;

      // Mock do login para lançar erro
      vi.mocked(UserService.prototype.login).mockRejectedValue(
        new Error('Email ou senha inválidos')
      );

      await userController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Email ou senha inválidos'
      });
    });
  });

  describe('getMe', () => {
    it('deve retornar dados do usuário logado', async () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'guest'
      };

      mockRequest.user = { id: '1', email: 'test@example.com', role: 'guest' };

      // Mock do getUserById
      vi.mocked(UserService.prototype.getUserById).mockResolvedValue(mockUser);

      await userController.getMe(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Dados do usuário obtidos com sucesso',
        user: mockUser
      });
    });

    it('deve falhar sem usuário autenticado', async () => {
      await userController.getMe(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Usuário não autenticado'
      });
    });

    it('deve falhar com usuário não encontrado', async () => {
      mockRequest.user = { id: '1', email: 'test@example.com', role: 'guest' };

      // Mock do getUserById para retornar null
      vi.mocked(UserService.prototype.getUserById).mockResolvedValue(null);

      await userController.getMe(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Usuário não encontrado'
      });
    });
  });

  describe('getAllUsers', () => {
    it('deve listar todos os usuários', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'User 1',
          email: 'user1@example.com',
          role: 'guest'
        },
        {
          id: '2',
          name: 'User 2',
          email: 'user2@example.com',
          role: 'admin'
        }
      ];

      // Mock do getAllUsers
      vi.mocked(UserService.prototype.getAllUsers).mockResolvedValue(mockUsers);

      await userController.getAllUsers(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Usuários listados com sucesso',
        users: mockUsers,
        total: 2
      });
    });
  });

  describe('getUserById', () => {
    it('deve retornar usuário específico', async () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'guest'
      };

      mockRequest.params = { id: '1' };

      // Mock do getUserById
      vi.mocked(UserService.prototype.getUserById).mockResolvedValue(mockUser);

      await userController.getUserById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Usuário encontrado com sucesso',
        user: mockUser
      });
    });

    it('deve falhar com usuário não encontrado', async () => {
      mockRequest.params = { id: '999' };

      // Mock do getUserById para retornar null
      vi.mocked(UserService.prototype.getUserById).mockResolvedValue(null);

      await userController.getUserById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Usuário não encontrado'
      });
    });
  });

  describe('updateUser', () => {
    it('deve atualizar usuário com sucesso', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const mockUser = {
        id: '1',
        name: 'Updated Name',
        email: 'updated@example.com',
        role: 'guest'
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;

      // Mock do updateUser
      vi.mocked(UserService.prototype.updateUser).mockResolvedValue(mockUser);

      await userController.updateUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Usuário atualizado com sucesso',
        user: mockUser
      });
    });

    it('deve falhar com usuário não encontrado', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { name: 'Updated Name' };

      // Mock do updateUser para retornar null
      vi.mocked(UserService.prototype.updateUser).mockResolvedValue(null);

      await userController.updateUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Usuário não encontrado'
      });
    });
  });

  describe('deleteUser', () => {
    it('deve deletar usuário com sucesso', async () => {
      mockRequest.params = { id: '1' };

      // Mock do deleteUser
      vi.mocked(UserService.prototype.deleteUser).mockResolvedValue(true);

      await userController.deleteUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Usuário deletado com sucesso'
      });
    });

    it('deve falhar com usuário não encontrado', async () => {
      mockRequest.params = { id: '999' };

      // Mock do deleteUser para retornar false
      vi.mocked(UserService.prototype.deleteUser).mockResolvedValue(false);

      await userController.deleteUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Usuário não encontrado'
      });
    });
  });
}); 