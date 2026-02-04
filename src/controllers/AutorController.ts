import { Request, Response } from 'express';
import AutorService from '../services/AutorService';

const autorService = new AutorService();

export class AutorController {
  
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const autores = await autorService.getAllAutores();
      res.json({
        success: true,
        data: autores,
        message: 'Autores encontrados com sucesso'
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

      const result = await autorService.getAutoresPaginados(page, pageSize);
      
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
        message: 'Autores encontrados com sucesso'
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
      const autor = await autorService.getAutorById(id);
      
      res.json({
        success: true,
        data: autor,
        message: 'Autor encontrado com sucesso'
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
      const { nome, biografia, data_nascimento, nacionalidade } = req.body;

      if (!nome || nome.trim().length < 2) {
        res.status(400).json({
          success: false,
          message: 'Nome é obrigatório e deve ter pelo menos 2 caracteres'
        });
        return;
      }

      const autorData = {
        nome: nome.trim(),
        biografia: biografia ? biografia.trim() : null,
        data_nascimento: data_nascimento || null,
        nacionalidade: nacionalidade ? nacionalidade.trim() : null
      };

      const novoAutor = await autorService.createAutor(autorData);
      
      res.status(201).json({
        success: true,
        data: novoAutor,
        message: 'Autor criado com sucesso'
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
      const { nome, biografia, data_nascimento, nacionalidade } = req.body;

      const autorData: any = {};
      if (nome !== undefined) autorData.nome = nome.trim();
      if (biografia !== undefined) autorData.biografia = biografia ? biografia.trim() : null;
      if (data_nascimento !== undefined) autorData.data_nascimento = data_nascimento;
      if (nacionalidade !== undefined) autorData.nacionalidade = nacionalidade ? nacionalidade.trim() : null;

      if (Object.keys(autorData).length === 0) {
        res.status(400).json({
          success: false,
          message: 'Nenhum dado fornecido para atualização'
        });
        return;
      }

      const result = await autorService.updateAutor(id, autorData);
      
      res.json({
        success: true,
        data: result[1][0],
        message: 'Autor atualizado com sucesso'
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
      await autorService.deleteAutor(id);
      
      res.json({
        success: true,
        message: 'Autor deletado com sucesso'
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

      const autores = await autorService.searchAutores(nome);
      
      res.json({
        success: true,
        data: autores,
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
      const total = await autorService.getTotalAutores();
      
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

export default AutorController;