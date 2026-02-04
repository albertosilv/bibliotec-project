// src/repositories/EmprestimoRepository.ts
import { Emprestimo, EmprestimoCreationAttributes } from '../models/Emprestimo';
import { Usuario } from '../models/Usuario';
import { Livro } from '../models/Livro';
import { Op } from 'sequelize';

export class EmprestimoRepository {
  
  async findAll(): Promise<Emprestimo[]> {
    return await Emprestimo.findAll({
      order: [['data_emprestimo', 'DESC']]
    });
  }

  async findById(id: number): Promise<Emprestimo | null> {
    return await Emprestimo.findByPk(id);
  }

  async create(emprestimoData: EmprestimoCreationAttributes): Promise<Emprestimo> {
    return await Emprestimo.create(emprestimoData);
  }

  async update(id: number, emprestimoData: Partial<EmprestimoCreationAttributes>): Promise<[number, Emprestimo[]]> {
    return await Emprestimo.update(emprestimoData, {
      where: { id },
      returning: true
    });
  }

  async delete(id: number): Promise<number> {
    return await Emprestimo.destroy({
      where: { id }
    });
  }

  async count(): Promise<number> {
    return await Emprestimo.count();
  }

  async findByUsuario(usuarioId: number): Promise<Emprestimo[]> {
    return await Emprestimo.findAll({
      where: { usuario_id: usuarioId },
      order: [['data_emprestimo', 'DESC']]
    });
  }

  async findByLivro(livroId: number): Promise<Emprestimo[]> {
    return await Emprestimo.findAll({
      where: { livro_id: livroId },
      order: [['data_emprestimo', 'DESC']]
    });
  }

  // Busca empréstimos ativos
  async findAtivos(): Promise<Emprestimo[]> {
    return await Emprestimo.findAll({
      where: { status: 'ativo' },
      order: [['data_devolucao_prevista', 'ASC']]
    });
  }

  // Busca empréstimos atrasados
  async findAtrasados(): Promise<Emprestimo[]> {
    return await Emprestimo.findAll({
      where: {
        status: 'ativo',
        data_devolucao_prevista: {
          [Op.lt]: new Date() // data prevista menor que hoje = atrasado
        }
      },
      order: [['data_devolucao_prevista', 'ASC']]
    });
  }

  // Busca por status
  async findByStatus(status: string): Promise<Emprestimo[]> {
    return await Emprestimo.findAll({
      where: { status },
      order: [['data_emprestimo', 'DESC']]
    });
  }

  // Paginação simples
  async findPaginated(page: number = 1, pageSize: number = 10): Promise<{
    data: Emprestimo[],
    total: number,
    page: number,
    pageSize: number,
    totalPages: number
  }> {
    const offset = (page - 1) * pageSize;
    
    const { count, rows } = await Emprestimo.findAndCountAll({
      limit: pageSize,
      offset: offset,
      order: [['data_emprestimo', 'DESC']]
    });

    return {
      data: rows,
      total: count,
      page: page,
      pageSize: pageSize,
      totalPages: Math.ceil(count / pageSize)
    };
  }

  // Empréstimos com detalhes (usuário e livro)
  async findWithDetails(): Promise<Emprestimo[]> {
    return await Emprestimo.findAll({
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email'] },
        { model: Livro, as: 'livro', attributes: ['id', 'titulo'] }
      ],
      order: [['data_emprestimo', 'DESC']]
    });
  }

  // Empréstimo por ID com detalhes
  async findByIdWithDetails(id: number): Promise<Emprestimo | null> {
    return await Emprestimo.findByPk(id, {
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email'] },
        { model: Livro, as: 'livro', attributes: ['id', 'titulo', 'quantidade_disponivel'] }
      ]
    });
  }

  // Empréstimos por usuário com detalhes
  async findByUsuarioWithDetails(usuarioId: number): Promise<Emprestimo[]> {
    return await Emprestimo.findAll({
      where: { usuario_id: usuarioId },
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email'] },
        { model: Livro, as: 'livro', attributes: ['id', 'titulo'] }
      ],
      order: [['data_emprestimo', 'DESC']]
    });
  }

  // Registrar devolução
  async registrarDevolucao(id: number): Promise<[number, Emprestimo[]]> {
    return await Emprestimo.update(
      {
        data_devolucao_real: new Date(),
        status: 'devolvido'
      },
      {
        where: { id },
        returning: true
      }
    );
  }

  // Atualizar status para atrasado
  async marcarComoAtrasado(id: number): Promise<[number, Emprestimo[]]> {
    return await Emprestimo.update(
      { status: 'atrasado' },
      {
        where: { id },
        returning: true
      }
    );
  }

  // Verificar se usuário tem empréstimos ativos
  async usuarioTemEmprestimosAtivos(usuarioId: number): Promise<boolean> {
    const count = await Emprestimo.count({
      where: {
        usuario_id: usuarioId,
        status: 'ativo'
      }
    });
    return count > 0;
  }

  // Verificar se livro está emprestado
  async livroEstaEmprestado(livroId: number): Promise<boolean> {
    const count = await Emprestimo.count({
      where: {
        livro_id: livroId,
        status: 'ativo'
      }
    });
    return count > 0;
  }
}

export default EmprestimoRepository;