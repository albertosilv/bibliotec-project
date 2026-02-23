import { Autor, Categoria } from '../models';
import { Livro, LivroCreationAttributes } from '../models/Livro';
import { Op } from 'sequelize';

export class LivroRepository {
  
  async findAll(): Promise<Livro[]> {
    return await Livro.findAll({
      order: [['titulo', 'ASC']]
    });
  }

  async findById(id: number): Promise<Livro | null> {
    console.log(id)
    return await Livro.findByPk(id, {
    include: [
      { model: Categoria, as: 'categoria' },
      { model: Autor, as: 'autor' }
    ]
  });
  }

  async create(livroData: LivroCreationAttributes): Promise<Livro> {
    return await Livro.create(livroData);
  }

  async update(id: number, livroData: Partial<LivroCreationAttributes>): Promise<[number, Livro[]]> {
    return await Livro.update(livroData, {
      where: { id },
      returning: true
    });
  }

  async delete(id: number): Promise<number> {
    return await Livro.destroy({
      where: { id }
    });
  }

  async count(): Promise<number> {
    return await Livro.count();
  }

  async searchByTitulo(titulo: string): Promise<Livro[]> {
    return await Livro.findAll({
      where: {
        titulo: {
          [Op.like]: `%${titulo}%`
        }
      },
      order: [['titulo', 'ASC']]
    });
  }

  async findByAutor(autorId: number): Promise<Livro[]> {
    return await Livro.findAll({
      where: { autor_id: autorId },
      order: [['titulo', 'ASC']]
    });
  }

  async findByCategoria(categoriaId: number): Promise<Livro[]> {
    return await Livro.findAll({
      where: { categoria_id: categoriaId },
      order: [['titulo', 'ASC']]
    });
  }

  async findDisponiveis(): Promise<Livro[]> {
    return await Livro.findAll({
      where: {
        quantidade_disponivel: {
          [Op.gt]: 0
        }
      },
      order: [['titulo', 'ASC']]
    });
  }

  async findPaginated(page: number = 1, pageSize: number = 10): Promise<{
    data: Livro[],
    total: number,
    page: number,
    pageSize: number,
    totalPages: number
  }> {
    const offset = (page - 1) * pageSize;
    
    const { count, rows } = await Livro.findAndCountAll({
      limit: pageSize,
      offset: offset,
      order: [['titulo', 'ASC']]
    });

    return {
      data: rows,
      total: count,
      page: page,
      pageSize: pageSize,
      totalPages: Math.ceil(count / pageSize)
    };
  }

  async decrementarQuantidade(id: number): Promise<void> {
    const livro = await this.findById(id);
    if (livro && livro.quantidade_disponivel > 0) {
      await Livro.update(
        { quantidade_disponivel: livro.quantidade_disponivel - 1 },
        { where: { id } }
      );
    }
  }

  async incrementarQuantidade(id: number): Promise<void> {
    const livro = await this.findById(id);
    if (livro) {
      await Livro.update(
        { quantidade_disponivel: livro.quantidade_disponivel + 1 },
        { where: { id } }
      );
    }
  }
}

export default LivroRepository;