import { Request, Response } from 'express';
import CategoriaService from '../services/CategoriaService';

const categoriaService = new CategoriaService();

export class CategoriaController {
  
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const categorias = await categoriaService.getAllCategorias();
      res.json({
        success: true,
        data: categorias,
        message: 'Categorias encontradas com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getPaginated(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const result = await categoriaService.getCategoriasPaginadas(page, pageSize);
      
      res.json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
          hasNextPage: result.page < result.totalPages,
          hasPrevPage: result.page > 1
        },
        message: 'Categorias encontradas com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const categoria = await categoriaService.getCategoriaById(id);
      
      res.json({
        success: true,
        data: categoria,
        message: 'Categoria encontrada com sucesso'
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { nome, descricao } = req.body;

      if (!nome || nome.trim().length < 2) {
        res.status(400).json({
          success: false,
          message: 'Nome é obrigatório e deve ter pelo menos 2 caracteres'
        });
        return;
      }

      const categoriaData = {
        nome: nome.trim(),
        descricao: descricao ? descricao.trim() : null
      };

      const novaCategoria = await categoriaService.createCategoria(categoriaData);
      
      res.status(201).json({
        success: true,
        data: novaCategoria,
        message: 'Categoria criada com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { nome, descricao } = req.body;

      const categoriaData: any = {};
      if (nome !== undefined) categoriaData.nome = nome.trim();
      if (descricao !== undefined) categoriaData.descricao = descricao ? descricao.trim() : null;

      if (Object.keys(categoriaData).length === 0) {
        res.status(400).json({
          success: false,
          message: 'Nenhum dado fornecido para atualização'
        });
        return;
      }

      const result = await categoriaService.updateCategoria(id, categoriaData);
      
      res.json({
        success: true,
        data: result[1][0],
        message: 'Categoria atualizada com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      await categoriaService.deleteCategoria(id);
      
      res.json({
        success: true,
        message: 'Categoria deletada com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async search(req: Request, res: Response): Promise<void> {
    try {
      const { nome } = req.query;
      
      if (!nome || typeof nome !== 'string' || nome.trim().length < 2) {
        res.status(400).json({
          success: false,
          message: 'Parâmetro de busca é obrigatório e deve ter pelo menos 2 caracteres'
        });
        return;
      }

      const categorias = await categoriaService.searchCategorias(nome);
      
      res.json({
        success: true,
        data: categorias,
        message: 'Busca realizada com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const total = await categoriaService.getTotalCategorias();
      
      res.json({
        success: true,
        data: { total },
        message: 'Estatísticas encontradas'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default CategoriaController;