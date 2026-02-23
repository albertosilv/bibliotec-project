import { RecomendacaoRepository } from "../repositories/RecomendacaoRepository";
import { Recomendacao } from "../types/recomendacao.types";

export class RecomendacaoService {
  private repository: RecomendacaoRepository;

  constructor() {
    this.repository = new RecomendacaoRepository();
  }

  async recomendarParaUsuario(
    usuarioId: number,
    limit: number = 10
  ): Promise<Recomendacao[]> {
    const usuario = await this.repository.findUsuarioById(usuarioId);
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    const historico = await this.repository.findHistoricoEmprestimos(usuarioId);
    if (historico.length === 0) {
      return this.recomendarParaNovoUsuario(limit);
    }

    const recomendacoes: Recomendacao[] = [];
    const livrosAdicionados = new Set<number>();

    const categoriasFavoritas = await this.repository.findCategoriasFavoritas(usuarioId, 3);
    
    if (categoriasFavoritas.length > 0) {
      const livrosPorCategoria = await this.repository.findLivrosPorCategorias(
        categoriasFavoritas,
        usuarioId,
        Math.ceil(limit * 0.6)
      );

      for (const livro of livrosPorCategoria) {
        if (!livrosAdicionados.has(livro.id)) {
          recomendacoes.push({
            livro,
            score: 100,
            motivo: `Recomendado porque você gosta da categoria ${livro.categoria?.nome}`,
            tipo: 'categoria'
          });
          livrosAdicionados.add(livro.id);
        }
      }
    }

    const autoresFavoritos = await this.repository.findAutoresFavoritos(usuarioId, 3);
    
    if (autoresFavoritos.length > 0) {
      const livrosPorAutor = await this.repository.findLivrosPorAutores(
        autoresFavoritos,
        usuarioId,
        limit - recomendacoes.length
      );

      for (const livro of livrosPorAutor) {
        if (!livrosAdicionados.has(livro.id)) {
          recomendacoes.push({
            livro,
            score: 90,
            motivo: `Recomendado porque você gosta do autor ${livro.autor?.nome}`,
            tipo: 'autor'
          });
          livrosAdicionados.add(livro.id);
        }
      }
    }

    return recomendacoes.slice(0, limit);
  }

  async recomendarParaNovoUsuario(limit: number = 10): Promise<Recomendacao[]> {
    const livrosRecentes = await this.repository.findLivrosRecentes(limit);

    return livrosRecentes.map(livro => ({
      livro,
      score: 80,
      motivo: 'Novidade na biblioteca',
      tipo: 'categoria'
    }));
  }

  async recomendarPorCategoria(
    categoriaId: number,
    usuarioId: number | null = null,
    limit: number = 10
  ): Promise<Recomendacao[]> {
    const livros = await this.repository.findLivrosPorCategoria(
      categoriaId,
      usuarioId,
      limit
    );

    return livros.map(livro => ({
      livro,
      score: 100,
      motivo: `Livros da categoria ${livro.categoria?.nome}`,
      tipo: 'categoria'
    }));
  }

  async recomendarPorAutor(
    autorId: number,
    usuarioId: number | null = null,
    limit: number = 10
  ): Promise<Recomendacao[]> {
    const livros = await this.repository.findLivrosPorAutor(
      autorId,
      usuarioId,
      limit
    );

    return livros.map(livro => ({
      livro,
      score: 100,
      motivo: `Livros do autor ${livro.autor?.nome}`,
      tipo: 'autor'
    }));
  }

  async getPreferenciasUsuario(usuarioId: number): Promise<{
    categorias: { id: number; nome: string; total: number }[];
    autores: { id: number; nome: string; total: number }[];
  }> {
    return this.repository.findPreferenciasUsuario(usuarioId);
  }
}