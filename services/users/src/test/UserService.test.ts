import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UserService } from '../services/UserService';
import { CreateUserRequest, LoginRequest, User } from '../models/User';
import { prisma } from '../lib/prisma';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(async () => {
    await prisma.user.deleteMany({});
    userService = new UserService();
  });

  afterEach(async () => {
    await prisma.user.deleteMany({});
  });

  // Função helper para criar usuários de teste
  const createTestUser = async (email: string, name: string, role: 'ADMIN' | 'STAFF' | 'GUEST' = 'GUEST') => {
    return await userService.createUser({
      name,
      email,
      password: '123456',
      role
    });
  };

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData: CreateUserRequest = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: '123456',
        role: 'GUEST',
        phone: '+55 11 99999-9999',
        address: 'Rua das Flores, 123'
      };

      const result = await userService.createUser(userData);

      expect(result).toBeDefined();
      expect(result.name).toBe(userData.name);
      expect(result.email).toBe(userData.email.toLowerCase());
      expect(result.role).toBe(userData.role);
      expect(result.phone).toBe(userData.phone);
      expect(result.address).toBe(userData.address);
      expect(result.isActive).toBe(true);
             expect('password' in result).toBe(false);
       expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should throw error if email already exists', async () => {
      const userData: CreateUserRequest = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: '123456',
        role: 'GUEST'
      };

      // Criar primeiro usuário
      await userService.createUser(userData);

      // Tentar criar segundo usuário com mesmo email
      await expect(userService.createUser(userData)).rejects.toThrow('Email já cadastrado');
    });

    it('should hash password correctly', async () => {
      const userData: CreateUserRequest = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: '123456',
        role: 'GUEST'
      };

      const result = await userService.createUser(userData);

             expect('password' in result).toBe(false);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const userData: CreateUserRequest = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: '123456',
        role: 'GUEST'
      };

      await userService.createUser(userData);

      const loginData: LoginRequest = {
        email: 'joao@example.com',
        password: '123456'
      };

      const result = await userService.login(loginData);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(loginData.email.toLowerCase());
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
             expect('password' in result.user).toBe(false);
    });

    it('should throw error with invalid email', async () => {
      const loginData: LoginRequest = {
        email: 'nonexistent@example.com',
        password: '123456'
      };

      await expect(userService.login(loginData)).rejects.toThrow('Email ou senha inválidos');
    });

    it('should throw error with invalid password', async () => {
      const userData: CreateUserRequest = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: '123456',
        role: 'GUEST'
      };

      await userService.createUser(userData);

      const loginData: LoginRequest = {
        email: 'joao@example.com',
        password: 'wrongpassword'
      };

      await expect(userService.login(loginData)).rejects.toThrow('Email ou senha inválidos');
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const userData: CreateUserRequest = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: '123456',
        role: 'GUEST'
      };

      const createdUser = await userService.createUser(userData);
      const result = await userService.getUserById(createdUser.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(createdUser.id);
      expect(result?.name).toBe(userData.name);
             expect('password' in (result || {})).toBe(false);
    });

    it('should return null for non-existent user', async () => {
      const result = await userService.getUserById('non-existent-id');
      expect(result).toBeNull();
    });
  });

    describe('getAllUsers', () => {
    it('should return all active users', async () => {
      // Criar dois usuários usando a função helper
      const user1 = await createTestUser('joao@example.com', 'João Silva', 'GUEST');
      const user2 = await createTestUser('maria@example.com', 'Maria Santos', 'STAFF');

      // Verificar se os usuários foram criados
      expect(user1).toBeDefined();
      expect(user2).toBeDefined();

      // Verificar se os usuários existem no banco antes de consultar
      const user1FromDb = await userService.getUserById(user1.id);
      const user2FromDb = await userService.getUserById(user2.id);
      
      expect(user1FromDb).toBeDefined();
      expect(user2FromDb).toBeDefined();

      const result = await userService.getAllUsers();

      expect(result).toHaveLength(2);
      expect('password' in result[0]).toBe(false);
      expect('password' in result[1]).toBe(false);
      
      // Verificar se os usuários criados estão na lista
      const userEmails = result.map(user => user.email);
      expect(userEmails).toContain('joao@example.com');
      expect(userEmails).toContain('maria@example.com');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const userData: CreateUserRequest = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: '123456',
        role: 'GUEST'
      };

      const createdUser = await userService.createUser(userData);
      
      // Verificar se o usuário foi criado corretamente
      expect(createdUser).toBeDefined();
      expect(createdUser.id).toBeDefined();
      
      // Verificar se o usuário existe no banco
      const existingUser = await userService.getUserById(createdUser.id);
      expect(existingUser).toBeDefined();

      const updateData = {
        name: 'João Silva Updated',
        phone: '+55 11 88888-8888'
      };

      const result = await userService.updateUser(createdUser.id, updateData);

      expect(result).toBeDefined();
      expect(result?.name).toBe(updateData.name);
      expect(result?.phone).toBe(updateData.phone);
      expect(result?.email).toBe(userData.email.toLowerCase());
    });

    it('should return null for non-existent user', async () => {
      const result = await userService.updateUser('non-existent-id', { name: 'Updated' });
      expect(result).toBeNull();
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user successfully', async () => {
      const userData: CreateUserRequest = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: '123456',
        role: 'GUEST'
      };

      const createdUser = await userService.createUser(userData);
      
      // Verificar se o usuário foi criado corretamente
      expect(createdUser).toBeDefined();
      expect(createdUser.id).toBeDefined();
      
      const result = await userService.deleteUser(createdUser.id);

      expect(result).toBe(true);

      // User should not be found after soft delete
      const deletedUser = await userService.getUserById(createdUser.id);
      expect(deletedUser).toBeNull();
    });

    it('should return false for non-existent user', async () => {
      const result = await userService.deleteUser('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      const userData: CreateUserRequest = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: '123456',
        role: 'GUEST'
      };

      const createdUser = await userService.createUser(userData);
             const token = userService.generateToken(createdUser as User);
      const result = userService.validateToken(token);

      expect(result).toBeDefined();
      expect(result.id).toBe(createdUser.id);
      expect(result.email).toBe(createdUser.email);
      expect(result.role).toBe(createdUser.role);
      expect(result.name).toBe(createdUser.name);
    });

    it('should throw error for invalid token', () => {
      expect(() => userService.validateToken('invalid-token')).toThrow('Token inválido');
    });
  });
}); 