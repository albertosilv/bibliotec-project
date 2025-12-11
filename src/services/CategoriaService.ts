// src/services/CategoriaService.ts
import CategoriaRepository from '../repositories/CategoriaRepository';
import { Categoria, CategoriaCreationAttributes } from '../models/Categoria';

export class CategoriaService {
  private categoriaRepository: CategoriaRepository;

  constructor() {
    this.categoriaRepository = new CategoriaRepository();
  }

  // CRUD Básico
  async getAllCategorias(): Promise<Categoria[]> {
    try {
      return await this.categoriaRepository.findAll();
    } catch (error) {
      throw new Error(`Erro ao buscar categorias: ${error}`);
    }
  }

  async getCategoriaById(id: number): Promise<Categoria | null> {
    try {
      const categoria = await this.categoriaRepository.findById(id);
      if (!categoria) {
        throw new Error('Categoria não encontrada');
      }
      return categoria;
    } catch (error) {
      throw new Error(`Erro ao buscar categoria: ${error}`);
    }
  }

  async createCategoria(categoriaData: CategoriaCreationAttributes): Promise<Categoria> {
    try {
      if (!categoriaData.nome || categoriaData.nome.trim().length < 2) {
        throw new Error('Nome da categoria deve ter pelo menos 2 caracteres');
      }

      // Verificar se nome já existe
      const existing = await this.categoriaRepository.searchByName(categoriaData.nome);
      if (existing.length > 0) {
        throw new Error('Categoria com este nome já existe');
      }

      return await this.categoriaRepository.create(categoriaData);
    } catch (error) {
      throw new Error(`Erro ao criar categoria: ${error}`);
    }
  }

  async updateCategoria(id: number, categoriaData: Partial<CategoriaCreationAttributes>): Promise<[number, Categoria[]]> {
    try {
      const categoria = await this.categoriaRepository.findById(id);
      if (!categoria) {
        throw new Error('Categoria não encontrada');
      }

      if (categoriaData.nome && categoriaData.nome.trim().length < 2) {
        throw new Error('Nome da categoria deve ter pelo menos 2 caracteres');
      }

      // Se estiver mudando o nome, verificar se não existe outro com mesmo nome
      if (categoriaData.nome && categoriaData.nome !== categoria.nome) {
        const existing = await this.categoriaRepository.searchByName(categoriaData.nome);
        if (existing.length > 0) {
          throw new Error('Categoria com este nome já existe');
        }
      }

      return await this.categoriaRepository.update(id, categoriaData);
    } catch (error) {
      throw new Error(`Erro ao atualizar categoria: ${error}`);
    }
  }

  async deleteCategoria(id: number): Promise<number> {
    try {
      const categoria = await this.categoriaRepository.findById(id);
      if (!categoria) {
        throw new Error('Categoria não encontrada');
      }

      return await this.categoriaRepository.delete(id);
    } catch (error) {
      throw new Error(`Erro ao deletar categoria: ${error}`);
    }
  }

  // Busca por nome
  async searchCategorias(nome: string): Promise<Categoria[]> {
    try {
      if (!nome || nome.trim().length < 2) {
        throw new Error('Termo de busca deve ter pelo menos 2 caracteres');
      }
      return await this.categoriaRepository.searchByName(nome);
    } catch (error) {
      throw new Error(`Erro ao buscar categorias: ${error}`);
    }
  }

  // Paginação
  async getCategoriasPaginadas(page: number = 1, pageSize: number = 10): Promise<{
    data: Categoria[],
    total: number,
    page: number,
    pageSize: number,
    totalPages: number
  }> {
    try {
      if (page < 1) throw new Error('Página deve ser maior que 0');
      if (pageSize < 1 || pageSize > 100) throw new Error('Tamanho da página deve estar entre 1 e 100');

      return await this.categoriaRepository.findPaginated(page, pageSize);
    } catch (error) {
      throw new Error(`Erro ao buscar categorias paginadas: ${error}`);
    }
  }

  async getTotalCategorias(): Promise<number> {
    try {
      return await this.categoriaRepository.count();
    } catch (error) {
      throw new Error(`Erro ao contar categorias: ${error}`);
    }
  }
}

export default CategoriaService;