// src/services/EmprestimoService.ts
import EmprestimoRepository from '../repositories/EmprestimoRepository';
import { Emprestimo, EmprestimoCreationAttributes } from '../models/Emprestimo';

export class EmprestimoService {
  private emprestimoRepository: EmprestimoRepository;

  constructor() {
    this.emprestimoRepository = new EmprestimoRepository();
  }

  // CRUD Básico
  async getAllEmprestimos(): Promise<Emprestimo[]> {
    try {
      return await this.emprestimoRepository.findAll();
    } catch (error) {
      throw new Error(`Erro ao buscar empréstimos: ${error}`);
    }
  }

  async getEmprestimoById(id: number): Promise<Emprestimo | null> {
    try {
      const emprestimo = await this.emprestimoRepository.findById(id);
      if (!emprestimo) {
        throw new Error('Empréstimo não encontrado');
      }
      return emprestimo;
    } catch (error) {
      throw new Error(`Erro ao buscar empréstimo: ${error}`);
    }
  }

  async createEmprestimo(emprestimoData: EmprestimoCreationAttributes): Promise<Emprestimo> {
    try {
      // Validações
      if (!emprestimoData.usuario_id) {
        throw new Error('Usuário é obrigatório');
      }

      if (!emprestimoData.livro_id) {
        throw new Error('Livro é obrigatório');
      }

      if (!emprestimoData.data_emprestimo) {
        throw new Error('Data de empréstimo é obrigatória');
      }

      if (!emprestimoData.data_devolucao_prevista) {
        throw new Error('Data de devolução prevista é obrigatória');
      }

      // Verificar se data de devolução prevista é após data de empréstimo
      if (emprestimoData.data_devolucao_prevista <= emprestimoData.data_emprestimo) {
        throw new Error('Data de devolução prevista deve ser após a data de empréstimo');
      }

      return await this.emprestimoRepository.create(emprestimoData);
    } catch (error) {
      throw new Error(`Erro ao criar empréstimo: ${error}`);
    }
  }

  async updateEmprestimo(id: number, emprestimoData: Partial<EmprestimoCreationAttributes>): Promise<[number, Emprestimo[]]> {
    try {
      const emprestimo = await this.emprestimoRepository.findById(id);
      if (!emprestimo) {
        throw new Error('Empréstimo não encontrado');
      }

      // Validações para atualização
      if (emprestimoData.data_devolucao_prevista && emprestimoData.data_devolucao_prevista <= emprestimo.data_emprestimo) {
        throw new Error('Data de devolução prevista deve ser após a data de empréstimo');
      }

      return await this.emprestimoRepository.update(id, emprestimoData);
    } catch (error) {
      throw new Error(`Erro ao atualizar empréstimo: ${error}`);
    }
  }

  async deleteEmprestimo(id: number): Promise<number> {
    try {
      const emprestimo = await this.emprestimoRepository.findById(id);
      if (!emprestimo) {
        throw new Error('Empréstimo não encontrado');
      }

      return await this.emprestimoRepository.delete(id);
    } catch (error) {
      throw new Error(`Erro ao deletar empréstimo: ${error}`);
    }
  }

  // Busca por usuário
  async getEmprestimosByUsuario(usuarioId: number): Promise<Emprestimo[]> {
    try {
      return await this.emprestimoRepository.findByUsuario(usuarioId);
    } catch (error) {
      throw new Error(`Erro ao buscar empréstimos por usuário: ${error}`);
    }
  }

  // Busca por livro
  async getEmprestimosByLivro(livroId: number): Promise<Emprestimo[]> {
    try {
      return await this.emprestimoRepository.findByLivro(livroId);
    } catch (error) {
      throw new Error(`Erro ao buscar empréstimos por livro: ${error}`);
    }
  }

  // Busca empréstimos ativos
  async getEmprestimosAtivos(): Promise<Emprestimo[]> {
    try {
      return await this.emprestimoRepository.findAtivos();
    } catch (error) {
      throw new Error(`Erro ao buscar empréstimos ativos: ${error}`);
    }
  }

  // Busca empréstimos atrasados
  async getEmprestimosAtrasados(): Promise<Emprestimo[]> {
    try {
      return await this.emprestimoRepository.findAtrasados();
    } catch (error) {
      throw new Error(`Erro ao buscar empréstimos atrasados: ${error}`);
    }
  }

  // Busca por status
  async getEmprestimosByStatus(status: string): Promise<Emprestimo[]> {
    try {
      if (!['ativo', 'devolvido', 'atrasado'].includes(status)) {
        throw new Error('Status inválido. Use: ativo, devolvido ou atrasado');
      }
      return await this.emprestimoRepository.findByStatus(status);
    } catch (error) {
      throw new Error(`Erro ao buscar empréstimos por status: ${error}`);
    }
  }

  // Paginação
  async getEmprestimosPaginados(page: number = 1, pageSize: number = 10): Promise<{
    data: Emprestimo[],
    total: number,
    page: number,
    pageSize: number,
    totalPages: number
  }> {
    try {
      if (page < 1) throw new Error('Página deve ser maior que 0');
      if (pageSize < 1 || pageSize > 100) throw new Error('Tamanho da página deve estar entre 1 e 100');

      return await this.emprestimoRepository.findPaginated(page, pageSize);
    } catch (error) {
      throw new Error(`Erro ao buscar empréstimos paginados: ${error}`);
    }
  }

  // Empréstimos com detalhes
  async getEmprestimosWithDetails(): Promise<Emprestimo[]> {
    try {
      return await this.emprestimoRepository.findWithDetails();
    } catch (error) {
      throw new Error(`Erro ao buscar empréstimos com detalhes: ${error}`);
    }
  }

  // Empréstimo por ID com detalhes
  async getEmprestimoByIdWithDetails(id: number): Promise<Emprestimo | null> {
    try {
      const emprestimo = await this.emprestimoRepository.findByIdWithDetails(id);
      if (!emprestimo) {
        throw new Error('Empréstimo não encontrado');
      }
      return emprestimo;
    } catch (error) {
      throw new Error(`Erro ao buscar empréstimo com detalhes: ${error}`);
    }
  }

  // Empréstimos por usuário com detalhes
  async getEmprestimosByUsuarioWithDetails(usuarioId: number): Promise<Emprestimo[]> {
    try {
      return await this.emprestimoRepository.findByUsuarioWithDetails(usuarioId);
    } catch (error) {
      throw new Error(`Erro ao buscar empréstimos do usuário com detalhes: ${error}`);
    }
  }

  // Registrar devolução
  async registrarDevolucao(id: number): Promise<[number, Emprestimo[]]> {
    try {
      const emprestimo = await this.emprestimoRepository.findById(id);
      if (!emprestimo) {
        throw new Error('Empréstimo não encontrado');
      }

      if (emprestimo.status !== 'ativo') {
        throw new Error('Só é possível devolver empréstimos ativos');
      }

      return await this.emprestimoRepository.registrarDevolucao(id);
    } catch (error) {
      throw new Error(`Erro ao registrar devolução: ${error}`);
    }
  }

  // Atualizar status para atrasado
  async marcarComoAtrasado(id: number): Promise<[number, Emprestimo[]]> {
    try {
      const emprestimo = await this.emprestimoRepository.findById(id);
      if (!emprestimo) {
        throw new Error('Empréstimo não encontrado');
      }

      if (emprestimo.status !== 'ativo') {
        throw new Error('Só é possível marcar como atrasado empréstimos ativos');
      }

      return await this.emprestimoRepository.marcarComoAtrasado(id);
    } catch (error) {
      throw new Error(`Erro ao marcar como atrasado: ${error}`);
    }
  }

  // Verificar se usuário tem empréstimos ativos
  async usuarioTemEmprestimosAtivos(usuarioId: number): Promise<boolean> {
    try {
      return await this.emprestimoRepository.usuarioTemEmprestimosAtivos(usuarioId);
    } catch (error) {
      throw new Error(`Erro ao verificar empréstimos do usuário: ${error}`);
    }
  }

  // Verificar se livro está emprestado
  async livroEstaEmprestado(livroId: number): Promise<boolean> {
    try {
      return await this.emprestimoRepository.livroEstaEmprestado(livroId);
    } catch (error) {
      throw new Error(`Erro ao verificar status do livro: ${error}`);
    }
  }

  async getTotalEmprestimos(): Promise<number> {
    try {
      return await this.emprestimoRepository.count();
    } catch (error) {
      throw new Error(`Erro ao contar empréstimos: ${error}`);
    }
  }

  async getEmprestimosStats(): Promise<{
    total: number,
    ativos: number,
    devolvidos: number,
    atrasados: number
  }> {
    try {
      const total = await this.emprestimoRepository.count();
      const ativos = await this.emprestimoRepository.findAtivos();
      const atrasados = await this.emprestimoRepository.findAtrasados();
      const devolvidos = await this.emprestimoRepository.findByStatus('devolvido');

      return {
        total,
        ativos: ativos.length,
        devolvidos: devolvidos.length,
        atrasados: atrasados.length
      };
    } catch (error) {
      throw new Error(`Erro ao buscar estatísticas: ${error}`);
    }
  }
}

export default EmprestimoService;