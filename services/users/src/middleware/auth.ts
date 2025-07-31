import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService';
import { AuthUser } from '../models/User';

// Extender a interface Request para incluir o usuário autenticado
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export class AuthMiddleware {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  // Middleware para autenticar usuário
  authenticate = (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          error: 'Token de autenticação não fornecido' 
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer '
      
      const decoded = this.userService.validateToken(token) as AuthUser;
      req.user = decoded;
      
      return next();
    } catch (error) {
      return res.status(401).json({ 
        error: 'Token inválido' 
      });
    }
  };

  // Middleware para verificar roles específicos
  requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Usuário não autenticado' 
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ 
          error: 'Acesso negado. Permissão insuficiente.' 
        });
      }

      return next();
    };
  };

  // Middleware para verificar se é o próprio usuário ou admin
  requireOwnershipOrAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuário não autenticado' 
      });
    }

    const userId = req.params.id || req.params.userId;
    
    if (req.user.role === 'ADMIN' || req.user.id === userId) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Acesso negado. Você só pode acessar seus próprios dados.' 
    });
  };
} 