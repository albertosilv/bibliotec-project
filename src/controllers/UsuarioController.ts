// src/controllers/UsuarioController.ts
import { Request, Response } from 'express';
import UsuarioService from '../services/UsuarioService';

const usuarioService = new UsuarioService();

export class UsuarioController {
  
  async getAllUsuarios(req: Request, res: Response): Promise<void> {
    try {
      const usuarios = await usuarioService.getAllUsuarios();
      res.json({
        success: true,
        data: usuarios,
        message: 'Usuários encontrados com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getUsuarioById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const usuario = await usuarioService.getUsuarioById(id);
      
      res.json({
        success: true,
        data: usuario,
        message: 'Usuário encontrado com sucesso'
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  async createUsuario(req: Request, res: Response): Promise<void> {
    try {
      const { nome, email, senha, tipo } = req.body;

      // Validações básicas
      if (!nome || !email || !senha) {
        res.status(400).json({
          success: false,
          message: 'Nome, email e senha são obrigatórios'
        });
        return;
      }

      const usuarioData = {
        nome,
        email,
        senha,
        tipo: tipo || 'cliente'
      };

      const novoUsuario = await usuarioService.createUsuario(usuarioData);
      
      res.status(201).json({
        success: true,
        data: novoUsuario,
        message: 'Usuário criado com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateUsuario(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { nome, email, senha, tipo } = req.body;

      const usuarioData: any = {};
      if (nome) usuarioData.nome = nome;
      if (email) usuarioData.email = email;
      if (senha) usuarioData.senha = senha;
      if (tipo) usuarioData.tipo = tipo;

      const result = await usuarioService.updateUsuario(id, usuarioData);
      
      res.json({
        success: true,
        data: result[1][0],
        message: 'Usuário atualizado com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteUsuario(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      await usuarioService.deleteUsuario(id);
      
      res.json({
        success: true,
        message: 'Usuário deletado com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getUsuarioByEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.query;
      
      if (!email || typeof email !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Email é obrigatório'
        });
        return;
      }

      const usuario = await usuarioService.getUsuarioByEmail(email);
      
      if (!usuario) {
        res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        data: usuario,
        message: 'Usuário encontrado com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default UsuarioController;