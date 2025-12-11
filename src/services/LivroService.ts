// src/services/LivroService.ts
import LivroRepository from '../repositories/LivroRepository';
import { Livro, LivroCreationAttributes } from '../models/Livro';

export class LivroService {
  private livroRepository: LivroRepository;

  constructor() {
    this.livroRepository = new LivroRepository();
  }

  // CRUD Básico
  async getAllLivros(): Promise<Livro[]> {
    try {
      return await this.livroRepository.findAll();
    } catch (error) {
      throw new Error(`Erro ao buscar livros: ${error}`);
    }
  }

  async getLivroById(id: number): Promise<Livro | null> {
    try {
      const livro = await this.livroRepository.findById(id);
      if (!livro) {
        throw new Error('Livro não encontrado');
      }
      return livro;
    } catch (error) {
      throw new Error(`Erro ao buscar livro: ${error}`);
    }
  }

  async createLivro(livroData: LivroCreationAttributes): Promise<Livro> {
    try {
      // Validações
      if (!livroData.titulo || livroData.titulo.trim().length < 2) {
        throw new Error('Título deve ter pelo menos 2 caracteres');
      }

      if (!livroData.ano_publicacao || livroData.ano_publicacao < 0) {
        throw new Error('Ano de publicação é obrigatório e deve ser positivo');
      }

      if (livroData.ano_publicacao > new Date().getFullYear()) {
        throw new Error('Ano de publicação não pode ser no futuro');
      }

      if (livroData.quantidade_disponivel < 0) {
        throw new Error('Quantidade disponível não pode ser negativa');
      }

      if (!livroData.autor_id) {
        throw new Error('Autor é obrigatório');
      }

      if (!livroData.categoria_id) {
        throw new Error('Categoria é obrigatória');
      }

      return await this.livroRepository.create(livroData);
    } catch (error) {
      throw new Error(`Erro ao criar livro: ${error}`);
    }
  }

  async updateLivro(id: number, livroData: Partial<LivroCreationAttributes>): Promise<[number, Livro[]]> {
    try {
      const livro = await this.livroRepository.findById(id);
      if (!livro) {
        throw new Error('Livro não encontrado');
      }

      // Validações
      if (livroData.titulo && livroData.titulo.trim().length < 2) {
        throw new Error('Título deve ter pelo menos 2 caracteres');
      }

      if (livroData.ano_publicacao && livroData.ano_publicacao > new Date().getFullYear()) {
        throw new Error('Ano de publicação não pode ser no futuro');
      }

      if (livroData.quantidade_disponivel !== undefined && livroData.quantidade_disponivel < 0) {
        throw new Error('Quantidade disponível não pode ser negativa');
      }

      return await this.livroRepository.update(id, livroData);
    } catch (error) {
      throw new Error(`Erro ao atualizar livro: ${error}`);
    }
  }

  async deleteLivro(id: number): Promise<number> {
    try {
      const livro = await this.livroRepository.findById(id);
      if (!livro) {
        throw new Error('Livro não encontrado');
      }

      return await this.livroRepository.delete(id);
    } catch (error) {
      throw new Error(`Erro ao deletar livro: ${error}`);
    }
  }

  // Busca por título
  async searchLivros(titulo: string): Promise<Livro[]> {
    try {
      if (!titulo || titulo.trim().length < 2) {
        throw new Error('Termo de busca deve ter pelo menos 2 caracteres');
      }
      return await this.livroRepository.searchByTitulo(titulo);
    } catch (error) {
      throw new Error(`Erro ao buscar livros: ${error}`);
    }
  }

  // Busca por autor
  async getLivrosByAutor(autorId: number): Promise<Livro[]> {
    try {
      return await this.livroRepository.findByAutor(autorId);
    } catch (error) {
      throw new Error(`Erro ao buscar livros por autor: ${error}`);
    }
  }

  // Busca por categoria
  async getLivrosByCategoria(categoriaId: number): Promise<Livro[]> {
    try {
      return await this.livroRepository.findByCategoria(categoriaId);
    } catch (error) {
      throw new Error(`Erro ao buscar livros por categoria: ${error}`);
    }
  }

  // Busca livros disponíveis
  async getLivrosDisponiveis(): Promise<Livro[]> {
    try {
      return await this.livroRepository.findDisponiveis();
    } catch (error) {
      throw new Error(`Erro ao buscar livros disponíveis: ${error}`);
    }
  }

  // Paginação
  async getLivrosPaginados(page: number = 1, pageSize: number = 10): Promise<{
    data: Livro[],
    total: number,
    page: number,
    pageSize: number,
    totalPages: number
  }> {
    try {
      if (page < 1) throw new Error('Página deve ser maior que 0');
      if (pageSize < 1 || pageSize > 100) throw new Error('Tamanho da página deve estar entre 1 e 100');

      return await this.livroRepository.findPaginated(page, pageSize);
    } catch (error) {
      throw new Error(`Erro ao buscar livros paginados: ${error}`);
    }
  }

  async getTotalLivros(): Promise<number> {
    try {
      return await this.livroRepository.count();
    } catch (error) {
      throw new Error(`Erro ao contar livros: ${error}`);
    }
  }

  // Métodos específicos de negócio
  async emprestarLivro(id: number): Promise<void> {
    try {
      const livro = await this.livroRepository.findById(id);
      if (!livro) {
        throw new Error('Livro não encontrado');
      }
      
      if (livro.quantidade_disponivel === 0) {
        throw new Error('Livro não disponível para empréstimo');
      }
      
      await this.livroRepository.decrementarQuantidade(id);
    } catch (error) {
      throw new Error(`Erro ao emprestar livro: ${error}`);
    }
  }

  async devolverLivro(id: number): Promise<void> {
    try {
      const livro = await this.livroRepository.findById(id);
      if (!livro) {
        throw new Error('Livro não encontrado');
      }
      
      await this.livroRepository.incrementarQuantidade(id);
    } catch (error) {
      throw new Error(`Erro ao devolver livro: ${error}`);
    }
  }
}

export default LivroService;