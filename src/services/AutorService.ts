import AutorRepository from '../repositories/AutorRepository';
import { Autor, AutorCreationAttributes } from '../models/Autor';

export class AutorService {
  private autorRepository: AutorRepository;

  constructor() {
    this.autorRepository = new AutorRepository();
  }

  // CRUD Básico
  async getAllAutores(): Promise<Autor[]> {
    try {
      return await this.autorRepository.findAll();
    } catch (error) {
      throw new Error(`Erro ao buscar autores: ${error}`);
    }
  }

  async getAutorById(id: number): Promise<Autor | null> {
    try {
      const autor = await this.autorRepository.findById(id);
      if (!autor) {
        throw new Error('Autor não encontrado');
      }
      return autor;
    } catch (error) {
      throw new Error(`Erro ao buscar autor: ${error}`);
    }
  }

  async createAutor(autorData: AutorCreationAttributes): Promise<Autor> {
    try {
      if (!autorData.nome || autorData.nome.trim().length < 2) {
        throw new Error('Nome do autor deve ter pelo menos 2 caracteres');
      }

      return await this.autorRepository.create(autorData);
    } catch (error) {
      throw new Error(`Erro ao criar autor: ${error}`);
    }
  }

  async updateAutor(id: number, autorData: Partial<AutorCreationAttributes>): Promise<[number, Autor[]]> {
    try {
      const autor = await this.autorRepository.findById(id);
      if (!autor) {
        throw new Error('Autor não encontrado');
      }

      if (autorData.nome && autorData.nome.trim().length < 2) {
        throw new Error('Nome do autor deve ter pelo menos 2 caracteres');
      }

      return await this.autorRepository.update(id, autorData);
    } catch (error) {
      throw new Error(`Erro ao atualizar autor: ${error}`);
    }
  }

  async deleteAutor(id: number): Promise<number> {
    try {
      const autor = await this.autorRepository.findById(id);
      if (!autor) {
        throw new Error('Autor não encontrado');
      }

      return await this.autorRepository.delete(id);
    } catch (error) {
      throw new Error(`Erro ao deletar autor: ${error}`);
    }
  }

  async searchAutores(nome: string): Promise<Autor[]> {
    try {
      if (!nome || nome.trim().length < 2) {
        throw new Error('Termo de busca deve ter pelo menos 2 caracteres');
      }
      return await this.autorRepository.searchByName(nome);
    } catch (error) {
      throw new Error(`Erro ao buscar autores: ${error}`);
    }
  }

  // Paginação
  async getAutoresPaginados(page: number = 1, pageSize: number = 10): Promise<{
    data: Autor[],
    total: number,
    page: number,
    pageSize: number,
    totalPages: number
  }> {
    try {
      if (page < 1) throw new Error('Página deve ser maior que 0');
      if (pageSize < 1 || pageSize > 100) throw new Error('Tamanho da página deve estar entre 1 e 100');

      return await this.autorRepository.findPaginated(page, pageSize);
    } catch (error) {
      throw new Error(`Erro ao buscar autores paginados: ${error}`);
    }
  }

  async getTotalAutores(): Promise<number> {
    try {
      return await this.autorRepository.count();
    } catch (error) {
      throw new Error(`Erro ao contar autores: ${error}`);
    }
  }
}

export default AutorService;