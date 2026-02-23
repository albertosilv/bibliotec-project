import { Op, fn, col, literal } from "sequelize";
import { Livro } from "../models/Livro";
import { Emprestimo } from "../models/Emprestimo";
import { Categoria } from "../models/Categoria";
import { Autor } from "../models/Autor";
import { Usuario } from "../models/Usuario";

export class RecomendacaoRepository {
    
  async findUsuarioById(usuarioId: number): Promise<Usuario | null> {
    return Usuario.findByPk(usuarioId);
  }
  
  async findCategoriasFavoritas(usuarioId: number, limit: number = 3): Promise<number[]> {
    const categorias = await Emprestimo.findAll({
      attributes: [
        [col('livro.categoria_id'), 'categoria_id'],
        [fn('COUNT', col('livro.categoria_id')), 'total']
      ],
      include: [{
        model: Livro,
        as: 'livro',
        attributes: []
      }],
      where: { usuario_id: usuarioId },
      group: [col('livro.categoria_id')],
      order: [[literal('total'), 'DESC']],
      limit,
      subQuery: false,
      raw: true
    });

    return categorias
      .map(c => (c as any).categoria_id)
      .filter(id => id !== null && id !== undefined);
  }

  async findLivrosPorCategorias(
    categoriasIds: number[],
    usuarioId: number,
    limit: number = 10
  ): Promise<Livro[]> {
    if (categoriasIds.length === 0) return [];

    return Livro.findAll({
      where: {
        categoria_id: { [Op.in]: categoriasIds },
        quantidade_disponivel: { [Op.gt]: 0 },
        id: {
          [Op.notIn]: literal(
            `(SELECT livro_id FROM emprestimos WHERE usuario_id = ${usuarioId})`
          )
        }
      },
      include: [
        { 
          model: Categoria, 
          as: 'categoria',
          attributes: ['id', 'nome', 'descricao']
        },
        { 
          model: Autor, 
          as: 'autor',
          attributes: ['id', 'nome']
        }
      ],
      limit
    });
  }

  // ============= AUTORES FAVORITOS =============
  
  async findAutoresFavoritos(usuarioId: number, limit: number = 3): Promise<number[]> {
    const autores = await Emprestimo.findAll({
      attributes: [
        [col('livro.autor_id'), 'autor_id'],
        [fn('COUNT', col('livro.autor_id')), 'total']
      ],
      include: [{
        model: Livro,
        as: 'livro',
        attributes: []
      }],
      where: { usuario_id: usuarioId },
      group: [col('livro.autor_id')],
      order: [[literal('total'), 'DESC']],
      limit,
      subQuery: false,
      raw: true
    });

    return autores
      .map(a => (a as any).autor_id)
      .filter(id => id !== null && id !== undefined);
  }

  async findLivrosPorAutores(
    autoresIds: number[],
    usuarioId: number,
    limit: number = 10
  ): Promise<Livro[]> {
    if (autoresIds.length === 0) return [];

    return Livro.findAll({
      where: {
        autor_id: { [Op.in]: autoresIds },
        quantidade_disponivel: { [Op.gt]: 0 },
        id: {
          [Op.notIn]: literal(
            `(SELECT livro_id FROM emprestimos WHERE usuario_id = ${usuarioId})`
          )
        }
      },
      include: [
        { 
          model: Categoria, 
          as: 'categoria',
          attributes: ['id', 'nome', 'descricao']
        },
        { 
          model: Autor, 
          as: 'autor',
          attributes: ['id', 'nome']
        }
      ],
      limit
    });
  }

  // ============= LIVROS =============
  
  async findLivrosRecentes(limit: number = 10): Promise<Livro[]> {
    return Livro.findAll({
      where: {
        quantidade_disponivel: { [Op.gt]: 0 }
      },
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Autor, as: 'autor' }
      ],
      order: [['createdAt', 'DESC']],
      limit
    });
  }

  async findLivrosPorCategoria(
    categoriaId: number,
    usuarioId: number | null = null,
    limit: number = 10
  ): Promise<Livro[]> {
    const whereClause: any = {
      categoria_id: categoriaId,
      quantidade_disponivel: { [Op.gt]: 0 }
    };

    if (usuarioId) {
      whereClause.id = {
        [Op.notIn]: literal(
          `(SELECT livro_id FROM emprestimos WHERE usuario_id = ${usuarioId})`
        )
      };
    }

    return Livro.findAll({
      where: whereClause,
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Autor, as: 'autor' }
      ],
      limit
    });
  }

  async findLivrosPorAutor(
    autorId: number,
    usuarioId: number | null = null,
    limit: number = 10
  ): Promise<Livro[]> {
    const whereClause: any = {
      autor_id: autorId,
      quantidade_disponivel: { [Op.gt]: 0 }
    };

    if (usuarioId) {
      whereClause.id = {
        [Op.notIn]: literal(
          `(SELECT livro_id FROM emprestimos WHERE usuario_id = ${usuarioId})`
        )
      };
    }

    return Livro.findAll({
      where: whereClause,
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Autor, as: 'autor' }
      ],
      limit
    });
  }

  // ============= HISTÓRICO =============
  
  async findHistoricoEmprestimos(usuarioId: number): Promise<Emprestimo[]> {
    return Emprestimo.findAll({
      where: { usuario_id: usuarioId },
      include: [{
        model: Livro,
        as: 'livro',
        include: [
          { 
            model: Categoria, 
            as: 'categoria',
            attributes: ['id', 'nome', 'descricao']
          },
          { 
            model: Autor, 
            as: 'autor',
            attributes: ['id', 'nome']
          }
        ]
      }],
      order: [['data_emprestimo', 'DESC']]
    });
  }

  // ============= PREFERÊNCIAS =============
  
  async findPreferenciasUsuario(usuarioId: number): Promise<{
    categorias: { id: number; nome: string; total: number }[];
    autores: { id: number; nome: string; total: number }[];
  }> {
    const categorias = await Emprestimo.findAll({
      attributes: [
        [col('livro.categoria.id'), 'id'],
        [col('livro.categoria.nome'), 'nome'],
        [fn('COUNT', col('livro.categoria_id')), 'total']
      ],
      include: [{
        model: Livro,
        as: 'livro',
        include: [{
          model: Categoria,
          as: 'categoria',
          attributes: []
        }],
        attributes: []
      }],
      where: { usuario_id: usuarioId },
      group: ['livro.categoria.id', 'livro.categoria.nome'],
      order: [[literal('total'), 'DESC']],
      limit: 5,
      raw: true
    });

    const autores = await Emprestimo.findAll({
      attributes: [
        [col('livro.autor.id'), 'id'],
        [col('livro.autor.nome'), 'nome'],
        [fn('COUNT', col('livro.autor_id')), 'total']
      ],
      include: [{
        model: Livro,
        as: 'livro',
        include: [{
          model: Autor,
          as: 'autor',
          attributes: []
        }],
        attributes: []
      }],
      where: { usuario_id: usuarioId },
      group: ['livro.autor.id', 'livro.autor.nome'],
      order: [[literal('total'), 'DESC']],
      limit: 5,
      raw: true
    });

    return {
      categorias: categorias as any[],
      autores: autores as any[]
    };
  }

  // ============= UTILITÁRIOS =============
  
  async findLivrosDisponiveis(livrosIds: number[]): Promise<Livro[]> {
    if (livrosIds.length === 0) return [];

    return Livro.findAll({
      where: {
        id: { [Op.in]: livrosIds },
        quantidade_disponivel: { [Op.gt]: 0 }
      },
      include: [
        { 
          model: Categoria, 
          as: 'categoria',
          attributes: ['id', 'nome', 'descricao']
        },
        { 
          model: Autor, 
          as: 'autor',
          attributes: ['id', 'nome']
        }
      ]
    });
  }
}