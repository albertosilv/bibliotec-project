// src/controllers/recomendacao.controller.ts
import { Request, Response } from "express";
import { RecomendacaoService } from "../services/RecomendacaoService";

const recomendacaoService = new RecomendacaoService();


export class RecomendacaoController {

  async getMinhasRecomendacoes(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = req.usuario?.id; 
      const limit = parseInt(req.query.limit as string) || 10;

      if (!usuarioId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const recomendacoes = await recomendacaoService.recomendarParaUsuario(usuarioId, limit);
      
      res.json({
        success: true,
        data: recomendacoes,
        total: recomendacoes.length
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao gerar recomendações' });
    }
  }

  async getRecomendacoesPorCategoria(req: Request, res: Response): Promise<void> {
    try {
      const { categoriaId } = req.params;
      const usuarioId = req.usuario?.id;
      const limit = parseInt(req.query.limit as string) || 10;

      const recomendacoes = await recomendacaoService.recomendarPorCategoria(
        parseInt(categoriaId),
        usuarioId,
        limit
      );

      res.json({
        success: true,
        data: recomendacoes,
        total: recomendacoes.length
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao gerar recomendações' });
    }
  }
  async getRecomendacoesPorAutor(req: Request, res: Response): Promise<void> {
    try {
      const { autorId } = req.params;
      const usuarioId = req.usuario?.id;
      const limit = parseInt(req.query.limit as string) || 10;

      const recomendacoes = await recomendacaoService.recomendarPorAutor(
        parseInt(autorId),
        usuarioId,
        limit
      );

      res.json({
        success: true,
        data: recomendacoes,
        total: recomendacoes.length
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao gerar recomendações' });
    }
  }

  async getMinhasPreferencias(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = req.usuario?.id;

      if (!usuarioId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const preferencias = await recomendacaoService.getPreferenciasUsuario(usuarioId);
      
      res.json({
        success: true,
        data: preferencias
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar preferências' });
    }
  }

  async getRecomendacoesParaNovoUsuario(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const recomendacoes = await recomendacaoService.recomendarParaNovoUsuario(limit);
      
      res.json({
        success: true,
        data: recomendacoes,
        total: recomendacoes.length
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao gerar recomendações' });
    }
  }
}