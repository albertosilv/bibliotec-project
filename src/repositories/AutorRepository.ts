// src/repositories/AutorRepository.ts
import { Autor, AutorCreationAttributes } from '../models/Autor';
import { Op } from 'sequelize';

export class AutorRepository {
  
  async findAll(): Promise<Autor[]> {
    return await Autor.findAll({
      order: [['nome', 'ASC']]
    });
  }

  async findById(id: number): Promise<Autor | null> {
    return await Autor.findByPk(id);
  }

  async create(autorData: AutorCreationAttributes): Promise<Autor> {
    return await Autor.create(autorData);
  }

  async update(id: number, autorData: Partial<AutorCreationAttributes>): Promise<[number, Autor[]]> {
    return await Autor.update(autorData, {
      where: { id },
      returning: true
    });
  }

  async delete(id: number): Promise<number> {
    return await Autor.destroy({
      where: { id }
    });
  }

  async count(): Promise<number> {
    return await Autor.count();
  }

  async searchByName(nome: string): Promise<Autor[]> {
    console.log(nome)
    return await Autor.findAll({
      where: {
        nome: {
          [Op.like]: `%${nome}%`
        }
      },
      order: [['nome', 'ASC']]
    });
  }

  // Paginação simples
  async findPaginated(page: number = 1, pageSize: number = 10): Promise<{
    data: Autor[],
    total: number,
    page: number,
    pageSize: number,
    totalPages: number
  }> {
    const offset = (page - 1) * pageSize;
    
    const { count, rows } = await Autor.findAndCountAll({
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

export default AutorRepository;