import UsuarioRepository from '../repositories/UsuarioRepository';
import { Usuario, UsuarioCreationAttributes } from '../models/Usuario';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';
import type { StringValue } from "ms";

dotenv.config();

export interface LoginData {
  email: string;
  senha: string;
}


export class AuthService {
  private usuarioRepository: UsuarioRepository;
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string|number;
  private readonly bcryptSaltRounds: number = 12;

  constructor() {
    this.usuarioRepository = new UsuarioRepository();
    this.jwtSecret = process.env.JWT_SECRET || 'sua_chave_secreta_aqui_altere_em_producao';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.bcryptSaltRounds);
  }

  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  private generateToken(usuario: Usuario): string {
    const payload = {
      id: usuario.id,
      email: usuario.email,
      tipo: usuario.tipo,
      nome: usuario.nome
    };

     const options: SignOptions = {
      expiresIn: this.jwtExpiresIn as StringValue
    };

    return jwt.sign(payload, this.jwtSecret, options);
  }

  // Remover senha do objeto usuário
  private removePassword(usuario: Usuario): {
    id: number;
    nome: string;
    email: string;
    tipo: 'admin' | 'cliente';
    createdAt: Date;
    updatedAt: Date;
  } {
    const usuarioObj = usuario.toJSON ? usuario.toJSON() : usuario;
    const { senha, ...usuarioSemSenha } = usuarioObj as any;
    return usuarioSemSenha;
  }

  async login(loginData: LoginData): Promise<any> {
    try {
      const { email, senha } = loginData;

      if (!email || !senha) {
        throw new Error('Email e senha são obrigatórios');
      }

      const usuario = await this.usuarioRepository.findByEmail(email);
      if (!usuario) {
        throw new Error('Email ou senha incorretos');
      }

      const isPasswordValid = await this.verifyPassword(senha, usuario.senha);
      if (!isPasswordValid) {
        throw new Error('Email ou senha incorretos');
      }

      const token = this.generateToken(usuario);

      return {
        success: true,
        usuario: this.removePassword(usuario),
        token,
        message: 'Login realizado com sucesso'
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async register(registerData: UsuarioCreationAttributes): Promise<any> {
    try {
      const { nome, email, senha, tipo = 'cliente' } = registerData;

      if (!nome || !email || !senha) {
        throw new Error('Nome, email e senha são obrigatórios');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Email inválido');
      }

      if (senha.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres');
      }

      const existingUser = await this.usuarioRepository.findByEmail(email);
      if (existingUser) {
        throw new Error('Email já está em uso');
      }

      const hashedPassword = await this.hashPassword(senha);

      const usuarioCriado = await this.usuarioRepository.create({
        nome,
        email,
        senha: hashedPassword,
        tipo
      });

      const token = this.generateToken(usuarioCriado);

      return {
        success: true,
        usuario: this.removePassword(usuarioCriado),
        token,
        message: 'Usuário registrado com sucesso'
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

   public validateToken(token: string): { 
    isValid: boolean; 
    payload?: { 
      id: number; 
      email: string; 
      tipo: string; 
      nome: string 
    } 
  } {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as any;
      return {
        isValid: true,
        payload: {
          id: payload.id,
          email: payload.email,
          tipo: payload.tipo,
          nome: payload.nome
        }
      };
    } catch (error) {
      return { isValid: false };
    }
  }


  public extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7); 
  }

 
  public async getUserFromToken(token: string): Promise<Usuario | null> {
    try {
      const validation = this.validateToken(token);
      
      if (!validation.isValid || !validation.payload) {
        return null;
      }

      return await this.usuarioRepository.findById(validation.payload.id);
    } catch (error) {
      return null;
    }
  }
}

export default AuthService;