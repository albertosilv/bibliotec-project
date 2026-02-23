import { Usuario, UsuarioCreationAttributes } from '../models/Usuario';
import { Op } from 'sequelize';

export class UsuarioRepository {
  
  async findAll(): Promise<Usuario[]> {
    return await Usuario.findAll();
  }

  async findById(id: number): Promise<Usuario | null> {
    return await Usuario.findByPk(id);
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    return await Usuario.findOne({
      where: { email }
    });
  }

  async create(usuarioData: UsuarioCreationAttributes): Promise<Usuario> {
    console.log(usuarioData)
    return await Usuario.create(usuarioData);
  }

  async update(id: number, usuarioData: Partial<UsuarioCreationAttributes>): Promise<[number, Usuario[]]> {
    return await Usuario.update(usuarioData, {
      where: { id },
      returning: true
    });
  }

  async delete(id: number): Promise<number> {
    return await Usuario.destroy({
      where: { id }
    });
  }

  async searchByName(nome: string): Promise<Usuario[]> {
    return await Usuario.findAll({
      where: {
        nome: {
          [Op.like]: `%${nome}%`
        }
      }
    });
  }

  async findAdmins(): Promise<Usuario[]> {
    return await Usuario.findAll({
      where: { tipo: 'admin' }
    });
  }
}

export default UsuarioRepository;