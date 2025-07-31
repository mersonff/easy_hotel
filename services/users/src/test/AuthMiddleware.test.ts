import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { AuthMiddleware } from '../middleware/auth';
import { UserService } from '../services/UserService';

// Mock do UserService
vi.mock('../services/UserService');

describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    authMiddleware = new AuthMiddleware();
    mockRequest = {
      headers: {},
      params: {}
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    mockNext = vi.fn();
  });

  describe('authenticate', () => {
    it('deve autenticar com token válido', () => {
      const mockUser = { id: '1', email: 'test@example.com', role: 'GUEST' as const, name: 'Test User' };
      const mockToken = 'valid-token';

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`
      };

      // Mock do validateToken
      vi.mocked(UserService.prototype.validateToken).mockReturnValue(mockUser);

      authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('deve falhar sem header authorization', () => {
      authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Token de autenticação não fornecido'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve falhar com formato de token inválido', () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token'
      };

      authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Token de autenticação não fornecido'
      });
    });

    it('deve falhar com token inválido', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      // Mock do validateToken para lançar erro
      vi.mocked(UserService.prototype.validateToken).mockImplementation(() => {
        throw new Error('Token inválido');
      });

      authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Token inválido'
      });
    });
  });

  describe('requireRole', () => {
    beforeEach(() => {
      mockRequest.user = { id: '1', email: 'test@example.com', role: 'GUEST' as const, name: 'Test User' };
    });

    it('deve permitir acesso com role correto', () => {
      const middleware = authMiddleware.requireRole(['GUEST', 'ADMIN']);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('deve negar acesso com role incorreto', () => {
      const middleware = authMiddleware.requireRole(['ADMIN']);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Acesso negado. Permissão insuficiente.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve falhar sem usuário autenticado', () => {
      mockRequest.user = undefined;
      const middleware = authMiddleware.requireRole(['ADMIN']);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Usuário não autenticado'
      });
    });
  });

  describe('requireOwnershipOrAdmin', () => {
    beforeEach(() => {
      mockRequest.user = { id: '1', email: 'test@example.com', role: 'GUEST' as const, name: 'Test User' };
    });

    it('deve permitir acesso para admin', () => {
      mockRequest.user!.role = 'ADMIN';
      mockRequest.params = { id: '2' };

      authMiddleware.requireOwnershipOrAdmin(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('deve permitir acesso para próprio usuário', () => {
      mockRequest.params = { id: '1' };

      authMiddleware.requireOwnershipOrAdmin(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('deve negar acesso para outro usuário', () => {
      mockRequest.params = { id: '2' };

      authMiddleware.requireOwnershipOrAdmin(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Acesso negado. Você só pode acessar seus próprios dados.'
      });
    });

    it('deve falhar sem usuário autenticado', () => {
      mockRequest.user = undefined;

      authMiddleware.requireOwnershipOrAdmin(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Usuário não autenticado'
      });
    });
  });
}); 