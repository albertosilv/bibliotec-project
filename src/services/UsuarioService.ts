// src/services/UsuarioService.ts
import UsuarioRepository from '../repositories/UsuarioRepository';
import { Usuario, UsuarioCreationAttributes } from '../models/Usuario';

export class UsuarioService {
  private usuarioRepository: UsuarioRepository;

  constructor() {
    this.usuarioRepository = new UsuarioRepository();
  }

  async getAllUsuarios(): Promise<Usuario[]> {
    try {
      return await this.usuarioRepository.findAll();
    } catch (error) {
      throw new Error(`Erro ao buscar usuários: ${error}`);
    }
  }

  async getUsuarioById(id: number): Promise<Usuario | null> {
    try {
      const usuario = await this.usuarioRepository.findById(id);
      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }
      return usuario;
    } catch (error) {
      throw new Error(`Erro ao buscar usuário: ${error}`);
    }
  }

  async createUsuario(usuarioData: UsuarioCreationAttributes): Promise<Usuario> {
    try {
      // Verificar se email já existe
      const existingUser = await this.usuarioRepository.findByEmail(usuarioData.email);
      if (existingUser) {
        throw new Error('Email já está em uso');
      }

      return await this.usuarioRepository.create(usuarioData);
    } catch (error) {
      throw new Error(`Erro ao criar usuário: ${error}`);
    }
  }

  async updateUsuario(id: number, usuarioData: Partial<UsuarioCreationAttributes>): Promise<[number, Usuario[]]> {
    try {
      const usuario = await this.usuarioRepository.findById(id);
      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }
      if (usuarioData.email && usuarioData.email !== usuario.email) {
        const existingUser = await this.usuarioRepository.findByEmail(usuarioData.email);
        if (existingUser) {
          throw new Error('Email já está em uso');
        }
      }

      return await this.usuarioRepository.update(id, usuarioData);
    } catch (error) {
      throw new Error(`Erro ao atualizar usuário: ${error}`);
    }
  }

  async deleteUsuario(id: number): Promise<number> {
    try {
      const usuario = await this.usuarioRepository.findById(id);
      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }

      return await this.usuarioRepository.delete(id);
    } catch (error) {
      throw new Error(`Erro ao deletar usuário: ${error}`);
    }
  }

  async getUsuarioByEmail(email: string): Promise<Usuario | null> {
    try {
      return await this.usuarioRepository.findByEmail(email);
    } catch (error) {
      throw new Error(`Erro ao buscar usuário por email: ${error}`);
    }
  }

  async searchUsuariosByName(nome: string): Promise<Usuario[]> {
    try {
      return await this.usuarioRepository.searchByName(nome);
    } catch (error) {
      throw new Error(`Erro ao buscar usuários por nome: ${error}`);
    }
  }
}

export default UsuarioService;