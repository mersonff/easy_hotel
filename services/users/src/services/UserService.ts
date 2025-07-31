import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { User, LoginResponse, AuthUser, CreateUserRequest, UpdateUserRequest, LoginRequest } from '../models/User';

export class UserService {
  private readonly SALT_ROUNDS = 10;
  private readonly JWT_SECRET: string = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
  private readonly JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '24h';

  // Criar novo usuário
  async createUser(userData: CreateUserRequest): Promise<Omit<User, 'password'>> {
    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email.toLowerCase() }
    });

    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(userData.password, this.SALT_ROUNDS);

    // Criar usuário
    const newUser = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        role: userData.role || 'GUEST',
        phone: userData.phone,
        address: userData.address,
        isActive: true
      }
    });

    // Retornar sem a senha
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  // Buscar usuário por ID
  async getUserById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await prisma.user.findFirst({
      where: { 
        id,
        isActive: true 
      }
    });

    if (!user) return null;

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Buscar usuário por email
  async getUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findFirst({
      where: { 
        email: email.toLowerCase(),
        isActive: true 
      }
    });
  }

  // Listar todos os usuários
  async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    return users.map(({ password, ...user }: any) => user as Omit<User, 'password'>);
  }

  // Atualizar usuário
  async updateUser(id: string, updateData: UpdateUserRequest): Promise<Omit<User, 'password'> | null> {
    // Verificar se usuário existe
    const existingUser = await prisma.user.findFirst({
      where: { id, isActive: true }
    });

    if (!existingUser) return null;

    // Verificar se email já existe (se estiver sendo atualizado)
    if (updateData.email) {
      const emailExists = await prisma.user.findFirst({
        where: { 
          email: updateData.email.toLowerCase(),
          id: { not: id }
        }
      });

      if (emailExists) {
        throw new Error('Email já cadastrado');
      }
    }

    // Preparar dados para atualização
    const updatePayload: any = {};
    
    if (updateData.name) updatePayload.name = updateData.name;
    if (updateData.email) updatePayload.email = updateData.email.toLowerCase();
    if (updateData.phone !== undefined) updatePayload.phone = updateData.phone;
    if (updateData.address !== undefined) updatePayload.address = updateData.address;
    if (updateData.isActive !== undefined) updatePayload.isActive = updateData.isActive;
    if (updateData.role) updatePayload.role = updateData.role;

    // Hash da senha se fornecida
    if (updateData.password) {
      updatePayload.password = await bcrypt.hash(updateData.password, this.SALT_ROUNDS);
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updatePayload
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  // Deletar usuário (soft delete)
  async deleteUser(id: string): Promise<boolean> {
    // Verificar se usuário existe antes de tentar atualizar
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) {
      return false;
    }

    // Fazer soft delete
    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });
    
    return true;
  }

  // Login
  async login(loginData: LoginRequest): Promise<LoginResponse> {
    // Buscar usuário por email
    const user = await this.getUserByEmail(loginData.email);
    if (!user) {
      throw new Error('Email ou senha inválidos');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Email ou senha inválidos');
    }

    // Gerar tokens
    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
      refreshToken
    };
  }

  // Validar token
  validateToken(token: string): AuthUser {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as AuthUser;
      return decoded;
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  // Gerar token JWT
  generateToken(user: User): string {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };
    const options: SignOptions = { expiresIn: this.JWT_EXPIRES_IN as any };
    return jwt.sign(payload, this.JWT_SECRET, options);
  }

  // Gerar refresh token
  generateRefreshToken(user: User): string {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };
    const options: SignOptions = { expiresIn: '7d' };
    return jwt.sign(payload, this.JWT_SECRET, options);
  }

  // Método para limpar dados (usado em testes)
  async clearUsers() {
    await prisma.user.deleteMany();
  }
} 