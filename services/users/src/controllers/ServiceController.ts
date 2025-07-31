import { Request, Response } from 'express';
import { serviceAuthMiddleware } from '../middleware/serviceAuth';
import { reservationsClient, roomsClient, paymentsClient, notificationsClient } from '../lib/serviceClient';

export class ServiceController {
  // Endpoint para serviços obterem informações de usuário
  async getUserInfo(req: Request, res: Response) {
    try {
      // Este endpoint requer autenticação de serviço
      const userId = req.params.id;
      
      if (!userId) {
        return res.status(400).json({ 
          error: 'ID do usuário é obrigatório',
          code: 'MISSING_USER_ID'
        });
      }

      // Verificar se o serviço tem permissão para ler usuários
      if (!req.serviceInfo?.permissions.includes('read:users')) {
        return res.status(403).json({ 
          error: 'Permissão insuficiente para acessar dados de usuário',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      // Buscar informações do usuário (implementação simplificada)
      const userInfo = {
        id: userId,
        name: 'Usuário Exemplo',
        email: 'usuario@exemplo.com',
        role: 'GUEST',
        // Não incluir dados sensíveis como senha
      };

      return res.status(200).json({
        success: true,
        data: userInfo,
        service: req.serviceInfo?.serviceName
      });

    } catch (error) {
      console.error('Erro ao obter informações do usuário:', error);
      return res.status(500).json({ 
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Endpoint para verificar permissões de um serviço
  async checkServicePermissions(req: Request, res: Response) {
    try {
      if (!req.serviceInfo) {
        return res.status(401).json({ 
          error: 'Serviço não autenticado',
          code: 'SERVICE_NOT_AUTHENTICATED'
        });
      }

      return res.status(200).json({
        success: true,
        service: req.serviceInfo.serviceName,
        permissions: req.serviceInfo.permissions,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return res.status(500).json({ 
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Endpoint para comunicação entre serviços (exemplo)
  async communicateWithServices(req: Request, res: Response) {
    try {
      const { action, targetService, data } = req.body;

      if (!action || !targetService) {
        return res.status(400).json({ 
          error: 'Ação e serviço de destino são obrigatórios',
          code: 'MISSING_PARAMETERS'
        });
      }

      let result: any = {};

      // Exemplo de comunicação com outros serviços
      switch (targetService) {
        case 'reservations':
          if (action === 'check') {
            const healthCheck = await reservationsClient.healthCheck();
            result = { health: healthCheck };
          }
          break;

        case 'rooms':
          if (action === 'list') {
            const roomsResponse = await roomsClient.getRooms();
            result = roomsResponse;
          }
          break;

        case 'payments':
          if (action === 'status') {
            const healthCheck = await paymentsClient.healthCheck();
            result = { health: healthCheck };
          }
          break;

        case 'notifications':
          if (action === 'test') {
            const testNotification = await notificationsClient.sendEmail({
              to: 'test@example.com',
              subject: 'Teste de comunicação entre serviços',
              body: 'Este é um teste de comunicação entre serviços'
            });
            result = testNotification;
          }
          break;

        default:
          return res.status(400).json({ 
            error: 'Serviço de destino não reconhecido',
            code: 'UNKNOWN_SERVICE'
          });
      }

      return res.status(200).json({
        success: true,
        action,
        targetService,
        result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro na comunicação entre serviços:', error);
      return res.status(500).json({ 
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Endpoint para gerar API key (apenas em desenvolvimento)
  async generateApiKey(req: Request, res: Response) {
    try {
      // Verificar se é ambiente de desenvolvimento
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ 
          error: 'Geração de API keys não permitida em produção',
          code: 'PRODUCTION_RESTRICTION'
        });
      }

      const { serviceName } = req.body;

      if (!serviceName) {
        return res.status(400).json({ 
          error: 'Nome do serviço é obrigatório',
          code: 'MISSING_SERVICE_NAME'
        });
      }

      const apiKey = serviceAuthMiddleware.generateApiKey(serviceName);

      return res.status(200).json({
        success: true,
        serviceName,
        apiKey,
        warning: 'Esta API key é apenas para desenvolvimento!'
      });

    } catch (error) {
      console.error('Erro ao gerar API key:', error);
      return res.status(500).json({ 
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }
}

export const serviceController = new ServiceController(); 