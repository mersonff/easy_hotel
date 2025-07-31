import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';

// Função auxiliar para formatar erros do Zod
const formatZodError = (error: ZodError) => {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
};

// Middleware para validar request body
export const validateBody = (schema: ZodObject<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync(req.body);
      req.body = validatedData;
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: formatZodError(error)
        });
      }
      return res.status(400).json({ error: 'Erro de validação' });
    }
  };
};

// Middleware para validar request params
export const validateParams = (schema: ZodObject<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync(req.params);
      // Não sobrescrever req.params diretamente, apenas validar
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Parâmetros inválidos',
          details: formatZodError(error)
        });
      }
      return res.status(400).json({ error: 'Erro de validação' });
    }
  };
};

// Middleware para validar query parameters
export const validateQuery = (schema: ZodObject<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync(req.query);
      // Não sobrescrever req.query diretamente, apenas validar
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Parâmetros de consulta inválidos',
          details: formatZodError(error)
        });
      }
      return res.status(400).json({ error: 'Erro de validação' });
    }
  };
};

// Middleware para validar headers
export const validateHeaders = (schema: ZodObject<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync(req.headers);
      // Não sobrescrever req.headers diretamente, apenas validar
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Headers inválidos',
          details: formatZodError(error)
        });
      }
      return res.status(400).json({ error: 'Erro de validação' });
    }
  };
};
