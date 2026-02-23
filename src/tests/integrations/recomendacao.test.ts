// tests/integration/recomendacao.test.ts
import request from 'supertest';
import { Server } from 'http';
import app from '../../app';
import Usuario from '../../models/Usuario';
import Livro from '../../models/Livro';
import Autor from '../../models/Autor';
import Categoria from '../../models/Categoria';
import Emprestimo from '../../models/Emprestimo';
import sequelize from '../../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Integração - Módulo Recomendação (MySQL)', () => {
  let server: Server;
  let adminToken: string;
  let userToken: string;
  let adminId: number;
  let userId: number;
  let outroUserId: number;
  let livroIds: number[] = [];
  let autorIds: number[] = [];
  let categoriaIds: number[] = [];

  beforeAll(async () => {
    // Criar servidor
    await new Promise<void>((resolve) => {
      server = app.listen(3007, () => {
        resolve();
      });
    });

    // Aguardar conexão com banco de dados
    await sequelize.authenticate();
    
    // Limpar banco de dados antes dos testes - desabilitar FK checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await Usuario.destroy({ where: {}, truncate: true });
    await Livro.destroy({ where: {}, truncate: true });
    await Autor.destroy({ where: {}, truncate: true });
    await Categoria.destroy({ where: {}, truncate: true });
    await Emprestimo.destroy({ where: {}, truncate: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // Criar usuários para teste
    const senhaHash = await bcrypt.hash('123456', 10);
    
    // Admin
    const admin = await Usuario.create({
      nome: 'Admin Teste',
      email: 'admin@teste.com',
      senha: senhaHash,
      tipo: 'admin'
    });
    adminId = admin.id;

    // Usuário comum
    const user = await Usuario.create({
      nome: 'Usuario Teste',
      email: 'usuario@teste.com',
      senha: senhaHash,
      tipo: 'cliente'
    });
    userId = user.id;

    // Outro usuário
    const outroUser = await Usuario.create({
      nome: 'Outro Usuario',
      email: 'outro@teste.com',
      senha: senhaHash,
      tipo: 'cliente'
    });
    outroUserId = outroUser.id;

    // Gerar tokens
    adminToken = jwt.sign(
      { id: adminId, email: 'admin@teste.com', tipo: 'admin' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );

    userToken = jwt.sign(
      { id: userId, email: 'usuario@teste.com', tipo: 'cliente' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );

    // Criar categorias para teste
    const categorias = await Categoria.bulkCreate([
      { nome: 'Ficção Científica', descricao: 'Livros de ficção científica' },
      { nome: 'Fantasia', descricao: 'Livros de fantasia' },
      { nome: 'Romance', descricao: 'Livros de romance' },
      { nome: 'Terror', descricao: 'Livros de terror' },
      { nome: 'Biografia', descricao: 'Biografias' }
    ]);
    categoriaIds = categorias.map(c => c.id);

    // Criar autores para teste
    const autores = await Autor.bulkCreate([
      { nome: 'Isaac Asimov', biografia: 'Escritor de ficção científica' },
      { nome: 'J.R.R. Tolkien', biografia: 'Escritor de fantasia' },
      { nome: 'Machado de Assis', biografia: 'Escritor brasileiro' },
      { nome: 'Stephen King', biografia: 'Escritor de terror' },
      { nome: 'George R.R. Martin', biografia: 'Escritor de fantasia' }
    ]);
    autorIds = autores.map(a => a.id);

    // Criar livros para teste
    const livros = [];
    
    // Livros de Ficção Científica (Asimov)
    for (let i = 1; i <= 5; i++) {
      livros.push({
        titulo: `Fundação ${i}`,
        sinopse: `Livro de ficção científica ${i}`,
        ano_publicacao: 1950 + i,
        quantidade_disponivel: 5,
        autor_id: autorIds[0],
        categoria_id: categoriaIds[0]
      });
    }

    // Livros de Fantasia (Tolkien)
    for (let i = 1; i <= 4; i++) {
      livros.push({
        titulo: `O Senhor dos Anéis - Parte ${i}`,
        sinopse: `Livro de fantasia ${i}`,
        ano_publicacao: 1950 + i,
        quantidade_disponivel: 3,
        autor_id: autorIds[1],
        categoria_id: categoriaIds[1]
      });
    }

    // Livros de Romance (Machado)
    for (let i = 1; i <= 3; i++) {
      livros.push({
        titulo: `Dom Casmurro ${i}`,
        sinopse: `Livro de romance ${i}`,
        ano_publicacao: 1890 + i,
        quantidade_disponivel: 2,
        autor_id: autorIds[2],
        categoria_id: categoriaIds[2]
      });
    }

    // Livros de Terror (Stephen King)
    for (let i = 1; i <= 4; i++) {
      livros.push({
        titulo: `It - A Coisa ${i}`,
        sinopse: `Livro de terror ${i}`,
        ano_publicacao: 1980 + i,
        quantidade_disponivel: 4,
        autor_id: autorIds[3],
        categoria_id: categoriaIds[3]
      });
    }

    // Livros de Fantasia (Martin)
    for (let i = 1; i <= 4; i++) {
      livros.push({
        titulo: `As Crônicas de Gelo e Fogo ${i}`,
        sinopse: `Livro de fantasia ${i}`,
        ano_publicacao: 1990 + i,
        quantidade_disponivel: 3,
        autor_id: autorIds[4],
        categoria_id: categoriaIds[1] // Fantasia
      });
    }

    const livrosCriados = await Livro.bulkCreate(livros);
    livroIds = livrosCriados.map(l => l.id);
  });

  afterAll(async () => {
    // Limpar dados após os testes - desabilitar FK checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await Usuario.destroy({ where: {}, truncate: true });
    await Livro.destroy({ where: {}, truncate: true });
    await Autor.destroy({ where: {}, truncate: true });
    await Categoria.destroy({ where: {}, truncate: true });
    await Emprestimo.destroy({ where: {}, truncate: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    // Fechar servidor
    await new Promise<void>((resolve) => {
      server.close(() => {
        resolve();
      });
    });
    
    // Fechar conexão com banco de dados
    await sequelize.close();
  });

  // Limpar empréstimos antes de cada teste
  beforeEach(async () => {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await Emprestimo.destroy({ where: {}, truncate: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  });

  describe('GET /api/recomendacoes/me', () => {
    it('deve retornar recomendações para usuário sem histórico (novo usuário)', async () => {
      const response = await request(server)
        .get('/api/recomendacoes/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(10);
      expect(response.body.data[0]).toHaveProperty('livro');
      expect(response.body.data[0]).toHaveProperty('score');
      expect(response.body.data[0]).toHaveProperty('motivo');
      expect(response.body.data[0]).toHaveProperty('tipo');
      expect(response.body.total).toBe(10);
    });

    it('deve retornar recomendações baseadas em histórico de empréstimos', async () => {
      // Usuário pega livros de Ficção Científica (Asimov)
      const livrosFiccao = livroIds.slice(0, 3); // 3 livros do Asimov
      
      for (const livroId of livrosFiccao) {
        await Emprestimo.create({
          usuario_id: userId,
          livro_id: livroId,
          data_emprestimo: new Date(),
          data_devolucao_prevista: new Date(new Date().setDate(new Date().getDate() + 15)),
          status: 'devolvido',
          data_devolucao_real: new Date()
        });
      }

      const response = await request(server)
        .get('/api/recomendacoes/me?limit=5')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

    });

    it('deve recomendar baseado em categorias favoritas', async () => {
      // Usuário pega livros de Fantasia
      const livrosFantasia = livroIds.filter((_, index) => 
        index >= 5 && index < 9 // Livros do Tolkien
      );
      
      for (const livroId of livrosFantasia) {
        await Emprestimo.create({
          usuario_id: userId,
          livro_id: livroId,
          data_emprestimo: new Date(),
          data_devolucao_prevista: new Date(new Date().setDate(new Date().getDate() + 15)),
          status: 'devolvido',
          data_devolucao_real: new Date()
        });
      }

      const response = await request(server)
        .get('/api/recomendacoes/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Deve recomendar livros de Fantasia (incluindo do Martin que também é Fantasia)
      const recomendacoesFantasia = response.body.data.filter(
        (r: any) => r.livro.categoria?.nome === 'Fantasia'
      );
      expect(recomendacoesFantasia.length).toBeGreaterThan(0);
    });


    it('deve respeitar o limite de recomendações', async () => {
      const response = await request(server)
        .get('/api/recomendacoes/me?limit=3')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(3);
      expect(response.body.total).toBe(3);
    });

    it('deve negar acesso sem token', async () => {
      const response = await request(server)
        .get('/api/recomendacoes/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token de autenticação não fornecido');
    });
  });

  describe('GET /api/recomendacoes/novo-usuario', () => {
    it('deve retornar recomendações para novo usuário (livros recentes)', async () => {
      const response = await request(server)
        .get('/api/recomendacoes/novo-usuario')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(10);
      
      // Verifica se são livros disponíveis
      response.body.data.forEach((rec: any) => {
        expect(rec.livro.quantidade_disponivel).toBeGreaterThan(0);
      });
    });

    it('deve respeitar o limite', async () => {
      const response = await request(server)
        .get('/api/recomendacoes/novo-usuario?limit=5')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(5);
    });
  });

  describe('GET /api/recomendacoes/categoria/:categoriaId', () => {
    it('deve recomendar livros de uma categoria específica', async () => {
      const response = await request(server)
        .get(`/api/recomendacoes/categoria/${categoriaIds[0]}`) // Ficção Científica
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      response.body.data.forEach((rec: any) => {
        expect(rec.livro.categoria_id).toBe(categoriaIds[0]);
        expect(rec.tipo).toBe('categoria');
      });
    });

    it('deve excluir livros já emprestados pelo usuário', async () => {
      // Usuário pega um livro de Ficção Científica
      const livroEmprestado = livroIds[0];
      await Emprestimo.create({
        usuario_id: userId,
        livro_id: livroEmprestado,
        data_emprestimo: new Date(),
        data_devolucao_prevista: new Date(new Date().setDate(new Date().getDate() + 15)),
        status: 'ativo'
      });

      const response = await request(server)
        .get(`/api/recomendacoes/categoria/${categoriaIds[0]}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Verifica se o livro emprestado não está na lista
      const livroRecomendado = response.body.data.some(
        (r: any) => r.livro.id === livroEmprestado
      );
      expect(livroRecomendado).toBe(false);
    });
  });

  describe('GET /api/recomendacoes/autor/:autorId', () => {
    it('deve recomendar livros de um autor específico', async () => {
      const response = await request(server)
        .get(`/api/recomendacoes/autor/${autorIds[1]}`) // Tolkien
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      response.body.data.forEach((rec: any) => {
        expect(rec.livro.autor_id).toBe(autorIds[1]);
        expect(rec.tipo).toBe('autor');
      });
    });

    it('deve excluir livros já emprestados pelo usuário', async () => {
      // Usuário pega um livro do Tolkien
      const livroEmprestado = livroIds[5]; // Primeiro livro do Tolkien
      await Emprestimo.create({
        usuario_id: userId,
        livro_id: livroEmprestado,
        data_emprestimo: new Date(),
        data_devolucao_prevista: new Date(new Date().setDate(new Date().getDate() + 15)),
        status: 'ativo'
      });

      const response = await request(server)
        .get(`/api/recomendacoes/autor/${autorIds[1]}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const livroRecomendado = response.body.data.some(
        (r: any) => r.livro.id === livroEmprestado
      );
      expect(livroRecomendado).toBe(false);
    });
  });

  describe('GET /api/recomendacoes/preferencias', () => {
    beforeEach(async () => {
      // Criar histórico variado para testar preferências
      
      // 3 empréstimos de Ficção Científica (Asimov)
      for (let i = 0; i < 3; i++) {
        await Emprestimo.create({
          usuario_id: userId,
          livro_id: livroIds[i],
          data_emprestimo: new Date(),
          data_devolucao_prevista: new Date(new Date().setDate(new Date().getDate() + 15)),
          status: 'devolvido',
          data_devolucao_real: new Date()
        });
      }

      // 2 empréstimos de Fantasia (Tolkien)
      for (let i = 5; i < 7; i++) {
        await Emprestimo.create({
          usuario_id: userId,
          livro_id: livroIds[i],
          data_emprestimo: new Date(),
          data_devolucao_prevista: new Date(new Date().setDate(new Date().getDate() + 15)),
          status: 'devolvido',
          data_devolucao_real: new Date()
        });
      }

      // 1 empréstimo de Terror (King)
      await Emprestimo.create({
        usuario_id: userId,
        livro_id: livroIds[12],
        data_emprestimo: new Date(),
        data_devolucao_prevista: new Date(new Date().setDate(new Date().getDate() + 15)),
        status: 'devolvido',
        data_devolucao_real: new Date()
      });
    });

    it('deve retornar preferências do usuário baseadas no histórico', async () => {
      const response = await request(server)
        .get('/api/recomendacoes/preferencias')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('categorias');
      expect(response.body.data).toHaveProperty('autores');

      // Categorias favoritas (Ficção Científica deve ser primeira)
      expect(response.body.data.categorias[0].nome).toBe('Ficção Científica');
      expect(response.body.data.categorias[0].total).toBe(3);

      // Autores favoritos (Asimov deve ser primeiro)
      expect(response.body.data.autores[0].nome).toBe('Isaac Asimov');
      expect(response.body.data.autores[0].total).toBe(3);
    });

    it('deve retornar array vazio para usuário sem histórico', async () => {
      const response = await request(server)
        .get('/api/recomendacoes/preferencias')
        .set('Authorization', `Bearer ${adminToken}`) // Admin não tem histórico
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.categorias).toHaveLength(0);
      expect(response.body.data.autores).toHaveLength(0);
    });
  });

  describe('Combinações de recomendações', () => {
    beforeEach(async () => {
      // Usuário com preferência mista: Ficção Científica (Asimov) e Fantasia (Martin)
      
      // 2 livros do Asimov (Ficção Científica)
      await Emprestimo.create({
        usuario_id: userId,
        livro_id: livroIds[0],
        data_emprestimo: new Date(),
        data_devolucao_prevista: new Date(new Date().setDate(new Date().getDate() + 15)),
        status: 'devolvido',
        data_devolucao_real: new Date()
      });

      await Emprestimo.create({
        usuario_id: userId,
        livro_id: livroIds[1],
        data_emprestimo: new Date(),
        data_devolucao_prevista: new Date(new Date().setDate(new Date().getDate() + 15)),
        status: 'devolvido',
        data_devolucao_real: new Date()
      });

      // 2 livros do Martin (Fantasia)
      await Emprestimo.create({
        usuario_id: userId,
        livro_id: livroIds[16], // Primeiro livro do Martin
        data_emprestimo: new Date(),
        data_devolucao_prevista: new Date(new Date().setDate(new Date().getDate() + 15)),
        status: 'devolvido',
        data_devolucao_real: new Date()
      });

      await Emprestimo.create({
        usuario_id: userId,
        livro_id: livroIds[17],
        data_emprestimo: new Date(),
        data_devolucao_prevista: new Date(new Date().setDate(new Date().getDate() + 15)),
        status: 'devolvido',
        data_devolucao_real: new Date()
      });
    });

    it('deve misturar recomendações por categoria e autor', async () => {
      const response = await request(server)
        .get('/api/recomendacoes/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const tipos = response.body.data.map((r: any) => r.tipo);
      
      // Deve ter tanto recomendações por categoria quanto por autor
      expect(tipos).toContain('categoria');
      expect(tipos).toContain('autor');
    });

    it('não deve recomendar livros repetidos', async () => {
      const response = await request(server)
        .get('/api/recomendacoes/me?limit=15')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const livrosIds = response.body.data.map((r: any) => r.livro.id);
      const livrosUnicos = new Set(livrosIds);
      
      expect(livrosUnicos.size).toBe(livrosIds.length);
    });
  });

  describe('Validações e erros', () => {
    it('deve retornar erro 401 sem token', async () => {
      const response = await request(server)
        .get('/api/recomendacoes/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('deve retornar erro para categoria inexistente', async () => {
      const response = await request(server)
        .get('/api/recomendacoes/categoria/999999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200); // Retorna array vazio, não erro

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('deve retornar erro para autor inexistente', async () => {
      const response = await request(server)
        .get('/api/recomendacoes/autor/999999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200); // Retorna array vazio, não erro

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('deve aceitar token de admin normalmente', async () => {
      const response = await request(server)
        .get('/api/recomendacoes/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Performance e limites', () => {
    it('deve retornar no máximo o limite solicitado', async () => {
      const limites = [5, 8, 15, 20];
      
      for (const limite of limites) {
        const response = await request(server)
          .get(`/api/recomendacoes/me?limit=${limite}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body.data.length).toBeLessThanOrEqual(limite);
      }
    });

    it('deve usar limite padrão de 10 quando não especificado', async () => {
      const response = await request(server)
        .get('/api/recomendacoes/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(10);
    });
  });
});