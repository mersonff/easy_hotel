import { Request, Response, NextFunction } from 'express';

// Extender a interface Request para incluir informações do serviço
declare global {
  namespace Express {
    interface Request {
      serviceInfo?: {
        serviceName: string;
        permissions: string[];
      };
    }
  }
}

export class ServiceAuthMiddleware {
  private readonly API_KEYS: Map<string, { serviceName: string; permissions: string[] }>;

  constructor() {
    // Configurar API keys para cada serviço
    this.API_KEYS = new Map();
    
    // Obter API keys do ambiente
    const reservationsKey = process.env.RESERVATIONS_API_KEY || 'reservations-secret-key';
    const paymentsKey = process.env.PAYMENTS_API_KEY || 'payments-secret-key';
    const notificationsKey = process.env.NOTIFICATIONS_API_KEY || 'notifications-secret-key';
    const roomsKey = process.env.ROOMS_API_KEY || 'rooms-secret-key';

    // Mapear API keys para serviços e permissões
    this.API_KEYS.set(reservationsKey, {
      serviceName: 'reservations-service',
      permissions: ['read:users', 'write:reservations', 'read:rooms']
    });

    this.API_KEYS.set(paymentsKey, {
      serviceName: 'payments-service',
      permissions: ['read:users', 'write:payments', 'read:reservations']
    });

    this.API_KEYS.set(notificationsKey, {
      serviceName: 'notifications-service',
      permissions: ['read:users', 'write:notifications']
    });

    this.API_KEYS.set(roomsKey, {
      serviceName: 'rooms-service',
      permissions: ['read:rooms', 'write:rooms', 'read:reservations']
    });
  }

  // Middleware para autenticar comunicação entre serviços
  authenticateService = (req: Request, res: Response, next: NextFunction) => {
    try {
      const apiKey = req.headers['x-api-key'] || req.headers['x-service-key'];
      
      if (!apiKey || typeof apiKey !== 'string') {
        return res.status(401).json({ 
          error: 'API Key não fornecida',
          code: 'MISSING_API_KEY'
        });
      }

      const serviceInfo = this.API_KEYS.get(apiKey);
      
      if (!serviceInfo) {
        return res.status(401).json({ 
          error: 'API Key inválida',
          code: 'INVALID_API_KEY'
        });
      }

      // Adicionar informações do serviço à requisição
      req.serviceInfo = serviceInfo;
      
      return next();
    } catch (error) {
      return res.status(500).json({ 
        error: 'Erro na autenticação do serviço',
        code: 'SERVICE_AUTH_ERROR'
      });
    }
  };

  // Middleware para verificar permissões específicas
  requirePermission = (requiredPermission: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.serviceInfo) {
        return res.status(401).json({ 
          error: 'Serviço não autenticado',
          code: 'SERVICE_NOT_AUTHENTICATED'
        });
      }

      if (!req.serviceInfo.permissions.includes(requiredPermission)) {
        return res.status(403).json({ 
          error: 'Permissão insuficiente',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: requiredPermission,
          available: req.serviceInfo.permissions
        });
      }

      return next();
    };
  };

  // Middleware para verificar múltiplas permissões
  requireAnyPermission = (requiredPermissions: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.serviceInfo) {
        return res.status(401).json({ 
          error: 'Serviço não autenticado',
          code: 'SERVICE_NOT_AUTHENTICATED'
        });
      }

      const hasPermission = requiredPermissions.some(permission => 
        req.serviceInfo!.permissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Permissão insuficiente',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: requiredPermissions,
          available: req.serviceInfo.permissions
        });
      }

      return next();
    };
  };

  // Middleware para verificar se é um serviço específico
  requireService = (serviceName: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.serviceInfo) {
        return res.status(401).json({ 
          error: 'Serviço não autenticado',
          code: 'SERVICE_NOT_AUTHENTICATED'
        });
      }

      if (req.serviceInfo.serviceName !== serviceName) {
        return res.status(403).json({ 
          error: 'Acesso negado para este serviço',
          code: 'SERVICE_ACCESS_DENIED',
          required: serviceName,
          actual: req.serviceInfo.serviceName
        });
      }

      return next();
    };
  };

  // Método para gerar API key (usado apenas em desenvolvimento)
  generateApiKey(serviceName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${serviceName}-${timestamp}-${random}`;
  }

  // Método para validar API key
  validateApiKey(apiKey: string): boolean {
    return this.API_KEYS.has(apiKey);
  }

  // Método para obter informações do serviço
  getServiceInfo(apiKey: string) {
    return this.API_KEYS.get(apiKey);
  }
}

// Instância singleton
export const serviceAuthMiddleware = new ServiceAuthMiddleware(); 