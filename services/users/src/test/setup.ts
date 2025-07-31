import { beforeAll, afterAll, beforeEach } from 'vitest';

// Configurar banco de teste
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/easy_hotel_users_test?schema=public";

// Importar Prisma APÓS configurar as variáveis
import { prisma } from '../lib/prisma';

// Configurações globais para testes
beforeAll(async () => {
  // Conectar ao banco de teste
  await prisma.$connect();
  console.log('✅ Conectado ao banco de teste');
});

afterAll(async () => {
  // Desconectar do banco
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Limpar dados antes de cada teste
  await prisma.user.deleteMany();
}); 