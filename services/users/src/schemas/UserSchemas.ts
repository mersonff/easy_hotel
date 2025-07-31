import { z } from 'zod';

export const CreateUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres').trim(),
  email: z.string().email('Email inválido').toLowerCase().trim(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100, 'Senha deve ter no máximo 100 caracteres'),
  role: z.enum(['ADMIN', 'STAFF', 'GUEST']).default('GUEST'),
  phone: z.string().optional().refine(val => !val || /^\+?[\d\s\-\(\)]+$/.test(val), { message: 'Telefone inválido' }),
  address: z.string().max(200, 'Endereço deve ter no máximo 200 caracteres').optional()
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres').trim().optional(),
  email: z.string().email('Email inválido').toLowerCase().trim().optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100, 'Senha deve ter no máximo 100 caracteres').optional(),
  role: z.enum(['ADMIN', 'STAFF', 'GUEST']).optional(),
  phone: z.string().optional().refine(val => !val || /^\+?[\d\s\-\(\)]+$/.test(val), { message: 'Telefone inválido' }),
  address: z.string().max(200, 'Endereço deve ter no máximo 200 caracteres').optional(),
  isActive: z.boolean().optional()
});

export const LoginSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase().trim(),
  password: z.string().min(1, 'Senha é obrigatória')
});

export const UserIdSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório')
});

export const PaginationSchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  limit: z.string().optional().transform(val => parseInt(val || '10'))
});

// Inferred types
export type CreateUserRequest = z.infer<typeof CreateUserSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>;
export type LoginRequest = z.infer<typeof LoginSchema>;
export type UserIdParams = z.infer<typeof UserIdSchema>;
export type PaginationQuery = z.infer<typeof PaginationSchema>; 