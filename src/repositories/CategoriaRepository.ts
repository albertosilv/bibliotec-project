import { Categoria, CategoriaCreationAttributes } from '../models/Categoria';
import { Op } from 'sequelize';

export class CategoriaRepository {
  
  async findAll(): Promise<Categoria[]> {
    return await Categoria.findAll({
      order: [['nome', 'ASC']]
    });
  }

  async findById(id: number): Promise<Categoria | null> {
    return await Categoria.findByPk(id);
  }

  async create(categoriaData: CategoriaCreationAttributes): Promise<Categoria> {
    return await Categoria.create(categoriaData);
  }

  async update(id: number, categoriaData: Partial<CategoriaCreationAttributes>): Promise<[number, Categoria[]]> {
    return await Categoria.update(categoriaData, {
      where: { id },
      returning: true
    });
  }

  async delete(id: number): Promise<number> {
    return await Categoria.destroy({
      where: { id }
    });
  }

  async count(): Promise<number> {
    return await Categoria.count();
  }

  async searchByName(nome: string): Promise<Categoria[]> {
    return await Categoria.findAll({
      where: {
        nome: {
          [Op.like]: `%${nome}%`
        }
      },
      order: [['nome', 'ASC']]
    });
  }

  async findPaginated(page: number = 1, pageSize: number = 10): Promise<{
    data: Categoria[],
    total: number,
    page: number,
    pageSize: number,
    totalPages: number
  }> {
    const offset = (page - 1) * pageSize;
    
    const { count, rows } = await Categoria.findAndCountAll({
      limit: pageSize,
      offset: offset,
      order: [['nome', 'ASC']]
    });

    return {
      data: rows,
      total: count,
      page: page,
      pageSize: pageSize,
      totalPages: Math.ceil(count / pageSize)
    };
  }
}

export default CategoriaRepository;