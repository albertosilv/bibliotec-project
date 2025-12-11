// src/controllers/EmprestimoController.ts
import { Request, Response } from 'express';
import EmprestimoService from '../services/EmprestimoService';

const emprestimoService = new EmprestimoService();

export class EmprestimoController {
  
  // Listar todos (sem paginação)
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const emprestimos = await emprestimoService.getAllEmprestimos();
      res.json({
        success: true,
        data: emprestimos,
        message: 'Empréstimos encontrados com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Listar com detalhes
  async getWithDetails(req: Request, res: Response): Promise<void> {
    try {
      const emprestimos = await emprestimoService.getEmprestimosWithDetails();
      res.json({
        success: true,
        data: emprestimos,
        message: 'Empréstimos com detalhes encontrados com sucesso'
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

      const result = await emprestimoService.getEmprestimosPaginados(page, pageSize);
      
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
        message: 'Empréstimos encontrados com sucesso'
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
      const emprestimo = await emprestimoService.getEmprestimoById(id);
      
      res.json({
        success: true,
        data: emprestimo,
        message: 'Empréstimo encontrado com sucesso'
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  // Buscar por ID com detalhes
  async getByIdWithDetails(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const emprestimo = await emprestimoService.getEmprestimoByIdWithDetails(id);
      
      res.json({
        success: true,
        data: emprestimo,
        message: 'Empréstimo com detalhes encontrado com sucesso'
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
        usuario_id, 
        livro_id, 
        data_emprestimo, 
        data_devolucao_prevista 
      } = req.body;

      // Validações básicas
      if (!usuario_id) {
        res.status(400).json({
          success: false,
          message: 'Usuário é obrigatório'
        });
        return;
      }

      if (!livro_id) {
        res.status(400).json({
          success: false,
          message: 'Livro é obrigatório'
        });
        return;
      }

      if (!data_emprestimo) {
        res.status(400).json({
          success: false,
          message: 'Data de empréstimo é obrigatória'
        });
        return;
      }

      if (!data_devolucao_prevista) {
        res.status(400).json({
          success: false,
          message: 'Data de devolução prevista é obrigatória'
        });
        return;
      }

      const emprestimoData = {
        usuario_id: parseInt(usuario_id),
        livro_id: parseInt(livro_id),
        data_emprestimo: new Date(data_emprestimo),
        data_devolucao_prevista: new Date(data_devolucao_prevista),
        data_devolucao_real: null,
        status: 'ativo' as const
      };

      const novoEmprestimo = await emprestimoService.createEmprestimo(emprestimoData);
      
      res.status(201).json({
        success: true,
        data: novoEmprestimo,
        message: 'Empréstimo criado com sucesso'
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
        data_devolucao_prevista,
        status
      } = req.body;

      const emprestimoData: any = {};
      if (data_devolucao_prevista !== undefined) emprestimoData.data_devolucao_prevista = new Date(data_devolucao_prevista);
      if (status !== undefined) emprestimoData.status = status;

      if (Object.keys(emprestimoData).length === 0) {
        res.status(400).json({
          success: false,
          message: 'Nenhum dado fornecido para atualização'
        });
        return;
      }

      const result = await emprestimoService.updateEmprestimo(id, emprestimoData);
      
      res.json({
        success: true,
        data: result[1][0],
        message: 'Empréstimo atualizado com sucesso'
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
      await emprestimoService.deleteEmprestimo(id);
      
      res.json({
        success: true,
        message: 'Empréstimo deletado com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Buscar por usuário
  async getByUsuario(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = parseInt(req.params.usuarioId);
      const emprestimos = await emprestimoService.getEmprestimosByUsuario(usuarioId);
      
      res.json({
        success: true,
        data: emprestimos,
        message: 'Empréstimos do usuário encontrados com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Buscar por usuário com detalhes
  async getByUsuarioWithDetails(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = parseInt(req.params.usuarioId);
      const emprestimos = await emprestimoService.getEmprestimosByUsuarioWithDetails(usuarioId);
      
      res.json({
        success: true,
        data: emprestimos,
        message: 'Empréstimos do usuário com detalhes encontrados com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Buscar por livro
  async getByLivro(req: Request, res: Response): Promise<void> {
    try {
      const livroId = parseInt(req.params.livroId);
      const emprestimos = await emprestimoService.getEmprestimosByLivro(livroId);
      
      res.json({
        success: true,
        data: emprestimos,
        message: 'Empréstimos do livro encontrados com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Buscar ativos
  async getAtivos(req: Request, res: Response): Promise<void> {
    try {
      const emprestimos = await emprestimoService.getEmprestimosAtivos();
      
      res.json({
        success: true,
        data: emprestimos,
        message: 'Empréstimos ativos encontrados com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Buscar atrasados
  async getAtrasados(req: Request, res: Response): Promise<void> {
    try {
      const emprestimos = await emprestimoService.getEmprestimosAtrasados();
      
      res.json({
        success: true,
        data: emprestimos,
        message: 'Empréstimos atrasados encontrados com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Buscar por status
  async getByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.params;
      const emprestimos = await emprestimoService.getEmprestimosByStatus(status);
      
      res.json({
        success: true,
        data: emprestimos,
        message: `Empréstimos ${status} encontrados com sucesso`
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Registrar devolução
  async devolver(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const result = await emprestimoService.registrarDevolucao(id);
      
      res.json({
        success: true,
        data: result[1][0],
        message: 'Devolução registrada com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Marcar como atrasado
  async marcarAtrasado(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const result = await emprestimoService.marcarComoAtrasado(id);
      
      res.json({
        success: true,
        data: result[1][0],
        message: 'Empréstimo marcado como atrasado com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Verificar se usuário tem empréstimos ativos
  async checkUsuarioAtivos(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = parseInt(req.params.usuarioId);
      const temAtivos = await emprestimoService.usuarioTemEmprestimosAtivos(usuarioId);
      
      res.json({
        success: true,
        data: { tem_emprestimos_ativos: temAtivos },
        message: 'Verificação concluída'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Verificar se livro está emprestado
  async checkLivroEmprestado(req: Request, res: Response): Promise<void> {
    try {
      const livroId = parseInt(req.params.livroId);
      const estaEmprestado = await emprestimoService.livroEstaEmprestado(livroId);
      
      res.json({
        success: true,
        data: { esta_emprestado: estaEmprestado },
        message: 'Verificação concluída'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Estatísticas
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await emprestimoService.getEmprestimosStats();
      
      res.json({
        success: true,
        data: stats,
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

export default EmprestimoController;