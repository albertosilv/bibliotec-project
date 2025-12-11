// src/controllers/LivroController.ts
import { Request, Response } from 'express';
import LivroService from '../services/LivroService';

const livroService = new LivroService();

export class LivroController {
  
  // Listar todos (sem paginação - para selects simples)
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const livros = await livroService.getAllLivros();
      res.json({
        success: true,
        data: livros,
        message: 'Livros encontrados com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Listar com paginação
  async getPaginated(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const result = await livroService.getLivrosPaginados(page, pageSize);
      
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
        message: 'Livros encontrados com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Buscar por ID
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const livro = await livroService.getLivroById(id);
      
      res.json({
        success: true,
        data: livro,
        message: 'Livro encontrado com sucesso'
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  // Criar
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { 
        titulo, 
        sinopse, 
        ano_publicacao, 
        quantidade_disponivel, 
        autor_id,
        categoria_id 
      } = req.body;

      // Validações básicas
      if (!titulo || titulo.trim().length < 2) {
        res.status(400).json({
          success: false,
          message: 'Título é obrigatório e deve ter pelo menos 2 caracteres'
        });
        return;
      }

      if (!ano_publicacao || isNaN(ano_publicacao)) {
        res.status(400).json({
          success: false,
          message: 'Ano de publicação é obrigatório'
        });
        return;
      }

      if (!autor_id) {
        res.status(400).json({
          success: false,
          message: 'Autor é obrigatório'
        });
        return;
      }

      if (!categoria_id) {
        res.status(400).json({
          success: false,
          message: 'Categoria é obrigatória'
        });
        return;
      }

      const livroData = {
        titulo: titulo.trim(),
        sinopse: sinopse ? sinopse.trim() : null,
        ano_publicacao: parseInt(ano_publicacao),
        quantidade_disponivel: quantidade_disponivel || 0,
        autor_id: parseInt(autor_id),
        categoria_id: parseInt(categoria_id)
      };

      const novoLivro = await livroService.createLivro(livroData);
      
      res.status(201).json({
        success: true,
        data: novoLivro,
        message: 'Livro criado com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Atualizar
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { 
        titulo, 
        sinopse, 
        ano_publicacao, 
        quantidade_disponivel, 
        autor_id,
        categoria_id 
      } = req.body;

      const livroData: any = {};
      if (titulo !== undefined) livroData.titulo = titulo.trim();
      if (sinopse !== undefined) livroData.sinopse = sinopse ? sinopse.trim() : null;
      if (ano_publicacao !== undefined) livroData.ano_publicacao = parseInt(ano_publicacao);
      if (quantidade_disponivel !== undefined) livroData.quantidade_disponivel = parseInt(quantidade_disponivel);
      if (autor_id !== undefined) livroData.autor_id = parseInt(autor_id);
      if (categoria_id !== undefined) livroData.categoria_id = parseInt(categoria_id);

      if (Object.keys(livroData).length === 0) {
        res.status(400).json({
          success: false,
          message: 'Nenhum dado fornecido para atualização'
        });
        return;
      }

      const result = await livroService.updateLivro(id, livroData);
      
      res.json({
        success: true,
        data: result[1][0],
        message: 'Livro atualizado com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Deletar
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      await livroService.deleteLivro(id);
      
      res.json({
        success: true,
        message: 'Livro deletado com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Buscar por título
  async search(req: Request, res: Response): Promise<void> {
    try {
      const { titulo } = req.query;
      
      if (!titulo || typeof titulo !== 'string' || titulo.trim().length < 2) {
        res.status(400).json({
          success: false,
          message: 'Parâmetro de busca é obrigatório e deve ter pelo menos 2 caracteres'
        });
        return;
      }

      const livros = await livroService.searchLivros(titulo);
      
      res.json({
        success: true,
        data: livros,
        message: 'Busca realizada com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Buscar por autor
  async getByAutor(req: Request, res: Response): Promise<void> {
    try {
      const autorId = parseInt(req.params.autorId);
      const livros = await livroService.getLivrosByAutor(autorId);
      
      res.json({
        success: true,
        data: livros,
        message: 'Livros por autor encontrados com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Buscar por categoria
  async getByCategoria(req: Request, res: Response): Promise<void> {
    try {
      const categoriaId = parseInt(req.params.categoriaId);
      const livros = await livroService.getLivrosByCategoria(categoriaId);
      
      res.json({
        success: true,
        data: livros,
        message: 'Livros por categoria encontrados com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Buscar disponíveis
  async getDisponiveis(req: Request, res: Response): Promise<void> {
    try {
      const livros = await livroService.getLivrosDisponiveis();
      
      res.json({
        success: true,
        data: livros,
        message: 'Livros disponíveis encontrados com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Estatísticas simples
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const total = await livroService.getTotalLivros();
      const disponiveis = await livroService.getLivrosDisponiveis();
      
      res.json({
        success: true,
        data: { 
          total,
          disponiveis: disponiveis.length,
          indisponiveis: total - disponiveis.length
        },
        message: 'Estatísticas encontradas'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Emprestar livro
  async emprestar(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      await livroService.emprestarLivro(id);
      
      res.json({
        success: true,
        message: 'Livro emprestado com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Devolver livro
  async devolver(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      await livroService.devolverLivro(id);
      
      res.json({
        success: true,
        message: 'Livro devolvido com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default LivroController;