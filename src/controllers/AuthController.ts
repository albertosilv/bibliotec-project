import { Request, Response } from 'express';
import AuthService from '../services/AuthService';

const authService = new AuthService();

export class AuthController {
  
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        res.status(400).json({
          success: false,
          message: 'Email e senha são obrigatórios'
        });
        return;
      }

      const result = await authService.login({ email, senha });
      
      res.json({
        success: true,
        data: {
          usuario: result.usuario,
          token: result.token
        },
        message: 'Login realizado com sucesso'
      });
    } catch (error: any) {
      if (error.message.includes('Email ou senha incorretos')) {
        res.status(401).json({
          success: false,
          message: error.message
        });
        return;
      }
      
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { nome, email, senha, tipo } = req.body;

      if (!nome || !email || !senha) {
        res.status(400).json({
          success: false,
          message: 'Nome, email e senha são obrigatórios'
        });
        return;
      }

      const registerData = {
        nome,
        email,
        senha,
        tipo: tipo || 'cliente'
      };

      console.log(registerData)

      const result = await authService.register(registerData);
      
      res.status(201).json({
        success: true,
        data: {
          usuario: result.usuario,
          token: result.token
        },
        message: 'Usuário registrado com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default AuthController;