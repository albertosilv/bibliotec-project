import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/AuthService';

const authService = new AuthService();

declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: number;
        nome: string;
        email: string;
        tipo: 'admin' | 'cliente';
      };
      token?: string;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authService.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token de autenticação não fornecido'
      });
      return;
    }

    const usuario = await authService.getUserFromToken(token);

    if (!usuario) {
      res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
      return;
    }

    req.usuario = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo
    };
    req.token = token;

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erro na autenticação'
    });
  }
};


export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.usuario) {
    res.status(401).json({
      success: false,
      message: 'Usuário não autenticado'
    });
    return;
  }

  if (req.usuario.tipo !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Acesso negado. Permissão de administrador necessária'
    });
    return;
  }

  next();
};
