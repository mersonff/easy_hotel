import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma';
import { UserService } from '../services/UserService';

describe('Integration Tests - Rotas com Autenticação', () => {
  let testUser: any;
  let authToken: string;

  beforeEach(async () => {
    // Limpar banco de teste
    await prisma.user.deleteMany();
    
    // Criar usuário de teste
    const userService = new UserService();
    testUser = await userService.createUser({
      name: 'Test User',
      email: 'test@example.com',
      password: '123456',
      role: 'GUEST'
    });

    // Gerar token diretamente
    authToken = userService.generateToken(testUser as any);
  });

  afterEach(async () => {
    await prisma.user.deleteMany();
  });

  describe('Rotas Públicas', () => {
    it('deve permitir acesso a /health sem autenticação', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
    });

    it('deve permitir registro sem autenticação', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'New User',
          email: 'new@example.com',
          password: '123456'
        });

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe('new@example.com');
    });

    it('deve permitir login sem autenticação', async () => {
      // Usar o usuário já criado no beforeEach
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: '123456'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });
  });

  describe('Rotas Protegidas - Com Token Válido', () => {
    it('deve permitir acesso a /auth/me com token válido', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('deve permitir acesso ao próprio usuário com token válido', async () => {
      const response = await request(app)
        .get(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('deve permitir atualização do próprio usuário com token válido', async () => {
      // Criar usuário específico para este teste
      const userService = new UserService();
      const testUserForUpdate = await userService.createUser({
        name: 'Test User For Update',
        email: 'testupdate@example.com',
        password: '123456',
        role: 'GUEST'
      });
      const tokenForUpdate = userService.generateToken(testUserForUpdate as any);

      const response = await request(app)
        .put(`/users/${testUserForUpdate.id}`)
        .set('Authorization', `Bearer ${tokenForUpdate}`)
        .send({
          name: 'Updated Name'
        });

      expect(response.status).toBe(200);
      expect(response.body.user.name).toBe('Updated Name');
    });
  });

  describe('Rotas Protegidas - Sem Token', () => {
    it('deve negar acesso a /auth/me sem token', async () => {
      const response = await request(app).get('/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token de autenticação não fornecido');
    });

    it('deve negar acesso a /users/:id sem token', async () => {
      const response = await request(app).get(`/users/${testUser.id}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token de autenticação não fornecido');
    });

    it('deve negar acesso a /users sem token', async () => {
      const response = await request(app).get('/users');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token de autenticação não fornecido');
    });

    it('deve negar atualização sem token', async () => {
      const response = await request(app)
        .put(`/users/${testUser.id}`)
        .send({
          name: 'Updated Name'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token de autenticação não fornecido');
    });

    it('deve negar exclusão sem token', async () => {
      const response = await request(app).delete(`/users/${testUser.id}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token de autenticação não fornecido');
    });
  });

  describe('Rotas Protegidas - Com Token Inválido', () => {
    it('deve negar acesso com token inválido', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token inválido');
    });

    it('deve negar acesso com formato de token inválido', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'InvalidFormat token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token de autenticação não fornecido');
    });
  });

  describe('Rotas com Permissões Específicas', () => {
    it('deve negar acesso a /users para usuário não-admin', async () => {
      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Acesso negado. Permissão insuficiente.');
    });

    it('deve negar exclusão para usuário não-admin', async () => {
      const response = await request(app)
        .delete(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Acesso negado. Permissão insuficiente.');
    });

    it('deve negar acesso a outro usuário', async () => {
      // Criar outro usuário
      const otherUser = await prisma.user.create({
        data: {
          name: 'Other User',
          email: 'other@example.com',
          password: 'hashed-password',
          role: 'GUEST'
        }
      });

      const response = await request(app)
        .get(`/users/${otherUser.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Acesso negado. Você só pode acessar seus próprios dados.');

      // Limpar
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('Rotas Admin - Com Usuário Admin', () => {
    let adminUser: any;
    let adminToken: string;

    beforeEach(async () => {
      // Criar usuário admin
      const userService = new UserService();
      adminUser = await userService.createUser({
        name: 'Admin User',
        email: 'admin@example.com',
        password: '123456',
        role: 'ADMIN'
      });

      // Login como admin
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: '123456'
        });

      adminToken = loginResponse.body.token;
    });

    it('deve permitir acesso a /users para admin', async () => {
      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.users).toBeDefined();
    });

    it('deve permitir acesso a qualquer usuário para admin', async () => {
      const response = await request(app)
        .get(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('deve permitir exclusão para admin', async () => {
      const response = await request(app)
        .delete(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Usuário deletado com sucesso');
    });
  });
}); 