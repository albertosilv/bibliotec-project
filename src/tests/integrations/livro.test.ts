// tests/integration/livro.test.ts
import request from 'supertest';
import { Server } from 'http';
import app from '../../app';
import Livro from '../../models/Livro';
import Autor from '../../models/Autor';
import Categoria from '../../models/Categoria';
import Usuario from '../../models/Usuario';
import sequelize from '../../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';

describe('Integração - Módulo Livro (MySQL)', () => {
  let server: Server;
  let livroId: number;
  let autorId: number;
  let categoriaId: number;
  let adminToken: string;
  let userToken: string;
  let adminId: number;
  let userId: number;

  beforeAll(async () => {
    // Criar servidor
    await new Promise<void>((resolve) => {
      server = app.listen(3004, () => {
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

    // Criar autor e categoria base para os testes
    const autor = await Autor.create({
      nome: 'Autor Base Testes',
      biografia: 'Autor para testes de livros'
    });
    autorId = autor.id;

    const categoria = await Categoria.create({
      nome: 'Categoria Base Testes',
      descricao: 'Categoria para testes de livros'
    });
    categoriaId = categoria.id;
  });

  afterAll(async () => {
    // Limpar dados após os testes - desabilitar FK checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await Usuario.destroy({ where: {}, truncate: true });
    await Livro.destroy({ where: {}, truncate: true });
    await Autor.destroy({ where: {}, truncate: true });
    await Categoria.destroy({ where: {}, truncate: true });
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

  // Limpar apenas livros antes de cada teste (mantém autor, categoria e usuários)
  beforeEach(async () => {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await Livro.destroy({ where: {}, truncate: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  });

  describe('POST /api/livros', () => {
    it('deve criar um novo livro com sucesso (admin)', async () => {
      const novoLivro = {
        titulo: 'Dom Casmurro',
        sinopse: 'Romance de Machado de Assis sobre a história de Bento Santiago',
        ano_publicacao: 1899,
        quantidade_disponivel: 5,
        autor_id: autorId,
        categoria_id: categoriaId
      };

      const response = await request(server)
        .post('/api/livros')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(novoLivro)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.titulo).toBe(novoLivro.titulo);
      expect(response.body.data.sinopse).toBe(novoLivro.sinopse);
      expect(response.body.data.ano_publicacao).toBe(novoLivro.ano_publicacao);
      expect(response.body.data.quantidade_disponivel).toBe(novoLivro.quantidade_disponivel);
      expect(response.body.data.autor_id).toBe(autorId);
      expect(response.body.data.categoria_id).toBe(categoriaId);
      expect(response.body.message).toBe('Livro criado com sucesso');

      // Verifica no banco
      const livroDB = await Livro.findByPk(response.body.data.id);
      expect(livroDB).not.toBeNull();
      expect(livroDB?.titulo).toBe(novoLivro.titulo);
      
      livroId = response.body.data.id;
    });

    it('deve negar criação de livro para usuário não-admin', async () => {
      const novoLivro = {
        titulo: 'Memórias Póstumas',
        ano_publicacao: 1881,
        autor_id: autorId,
        categoria_id: categoriaId
      };

      const response = await request(server)
        .post('/api/livros')
        .set('Authorization', `Bearer ${userToken}`)
        .send(novoLivro)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Acesso negado');
    });

    it('deve negar criação sem token', async () => {
      const novoLivro = {
        titulo: 'Quincas Borba',
        ano_publicacao: 1891,
        autor_id: autorId,
        categoria_id: categoriaId
      };

      const response = await request(server)
        .post('/api/livros')
        .send(novoLivro)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token de autenticação não fornecido');
    });

    it('deve criar livro com quantidade disponível padrão 0 (admin)', async () => {
      const novoLivro = {
        titulo: 'Memórias Póstumas',
        ano_publicacao: 1881,
        autor_id: autorId,
        categoria_id: categoriaId
      };

      const response = await request(server)
        .post('/api/livros')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(novoLivro)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quantidade_disponivel).toBe(0);
    });

    it('deve retornar erro quando título não é informado (admin)', async () => {
      const response = await request(server)
        .post('/api/livros')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ano_publicacao: 1899,
          autor_id: autorId,
          categoria_id: categoriaId
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Título é obrigatório');
    });

    it('deve retornar erro quando título tem menos de 2 caracteres (admin)', async () => {
      const response = await request(server)
        .post('/api/livros')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titulo: 'L',
          ano_publicacao: 1899,
          autor_id: autorId,
          categoria_id: categoriaId
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('pelo menos 2 caracteres');
    });

    it('deve retornar erro quando ano de publicação é futuro (admin)', async () => {
      const anoFuturo = new Date().getFullYear() + 1;
      const response = await request(server)
        .post('/api/livros')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titulo: 'Livro do Futuro',
          ano_publicacao: anoFuturo,
          autor_id: autorId,
          categoria_id: categoriaId
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Ano de publicação não pode ser no futuro');
    });

    it('deve trimar espaços em branco do título e sinopse (admin)', async () => {
      const response = await request(server)
        .post('/api/livros')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titulo: '  O Alienista  ',
          sinopse: '  Sinopse com espaços  ',
          ano_publicacao: 1882,
          autor_id: autorId,
          categoria_id: categoriaId
        })
        .expect(201);

      expect(response.body.data.titulo).toBe('O Alienista');
      expect(response.body.data.sinopse).toBe('Sinopse com espaços');
    });
  });

  describe('GET /api/livros', () => {
    beforeEach(async () => {
      await Livro.bulkCreate([
        { titulo: 'Dom Casmurro', ano_publicacao: 1899, autor_id: autorId, categoria_id: categoriaId, quantidade_disponivel: 3 },
        { titulo: 'Memórias Póstumas', ano_publicacao: 1881, autor_id: autorId, categoria_id: categoriaId, quantidade_disponivel: 2 },
        { titulo: 'Quincas Borba', ano_publicacao: 1891, autor_id: autorId, categoria_id: categoriaId, quantidade_disponivel: 1 },
        { titulo: 'O Alienista', ano_publicacao: 1882, autor_id: autorId, categoria_id: categoriaId, quantidade_disponivel: 4 },
        { titulo: 'A Moreninha', ano_publicacao: 1844, autor_id: autorId, categoria_id: categoriaId, quantidade_disponivel: 5 }
      ]);
    });

    it('deve listar todos os livros com token válido', async () => {
      const response = await request(server)
        .get('/api/livros')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(5);
      expect(response.body.message).toBe('Livros encontrados com sucesso');
    });

    it('deve negar listagem sem token', async () => {
      const response = await request(server)
        .get('/api/livros')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token de autenticação não fornecido');
    });
  });

  describe('GET /api/livros/paginated', () => {
    beforeEach(async () => {
      const livros = [];
      for (let i = 1; i <= 15; i++) {
        livros.push({ 
          titulo: `Livro ${i}`,
          ano_publicacao: 2000 + i,
          autor_id: autorId,
          categoria_id: categoriaId,
          quantidade_disponivel: i
        });
      }
      await Livro.bulkCreate(livros);
    });

    it('deve retornar primeira página com 10 itens por padrão', async () => {
      const response = await request(server)
        .get('/api/livros/paginated')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.pageSize).toBe(10);
      expect(response.body.pagination.total).toBe(15);
      expect(response.body.pagination.totalPages).toBe(2);
    });

    it('deve retornar segunda página com 5 itens', async () => {
      const response = await request(server)
        .get('/api/livros/paginated?page=2&pageSize=10')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.pagination.page).toBe(2);
    });
  });

  describe('GET /api/livros/:id', () => {
    beforeEach(async () => {
      const livro = await Livro.create({
        titulo: 'Livro Teste Busca por ID',
        sinopse: 'Sinopse do livro de teste',
        ano_publicacao: 2020,
        quantidade_disponivel: 10,
        autor_id: autorId,
        categoria_id: categoriaId
      });
      livroId = livro.id;
    });

    it('deve buscar livro por ID com sucesso', async () => {
      const response = await request(server)
        .get(`/api/livros/${livroId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(livroId);
      expect(response.body.data.titulo).toBe('Livro Teste Busca por ID');
    });

    it('deve retornar erro para livro não encontrado', async () => {
      const response = await request(server)
        .get('/api/livros/999999999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Livro não encontrado');
    });
  });

  describe('PUT /api/livros/:id', () => {
    beforeEach(async () => {
      const livro = await Livro.create({
        titulo: 'Livro Teste Atualização',
        sinopse: 'Sinopse original',
        ano_publicacao: 2020,
        quantidade_disponivel: 5,
        autor_id: autorId,
        categoria_id: categoriaId
      });
      livroId = livro.id;
    });

    it('deve atualizar livro com sucesso (admin)', async () => {
      const response = await request(server)
        .put(`/api/livros/${livroId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titulo: 'Livro Teste Atualização Editado',
          sinopse: 'Sinopse atualizada',
          quantidade_disponivel: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve negar atualização para usuário não-admin', async () => {
      const response = await request(server)
        .put(`/api/livros/${livroId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          titulo: 'Tentativa'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Acesso negado');
    });
  });

  describe('DELETE /api/livros/:id', () => {
    beforeEach(async () => {
      const livro = await Livro.create({
        titulo: 'Livro Teste Para Deletar',
        ano_publicacao: 2020,
        autor_id: autorId,
        categoria_id: categoriaId
      });
      livroId = livro.id;
    });

    it('deve deletar livro com sucesso (admin)', async () => {
      const response = await request(server)
        .delete(`/api/livros/${livroId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Livro deletado com sucesso');

      const livroDB = await Livro.findByPk(livroId);
      expect(livroDB).toBeNull();
    });

    it('deve negar deleção para usuário não-admin', async () => {
      const response = await request(server)
        .delete(`/api/livros/${livroId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Acesso negado');
    });
  });

  describe('GET /api/livros/search', () => {
    beforeEach(async () => {
      await Livro.bulkCreate([
        { titulo: 'Dom Casmurro', ano_publicacao: 1899, autor_id: autorId, categoria_id: categoriaId },
        { titulo: 'Memórias Póstumas', ano_publicacao: 1881, autor_id: autorId, categoria_id: categoriaId },
        { titulo: 'Quincas Borba', ano_publicacao: 1891, autor_id: autorId, categoria_id: categoriaId }
      ]);
    });

    it('deve buscar livros por título com token válido', async () => {
      const response = await request(server)
        .get('/api/livros/search?titulo=Dom')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].titulo).toBe('Dom Casmurro');
    });
  });

  describe('GET /api/livros/autor/:autorId', () => {
    beforeEach(async () => {
      await Livro.bulkCreate([
        { titulo: 'Livro 1', ano_publicacao: 2000, autor_id: autorId, categoria_id: categoriaId },
        { titulo: 'Livro 2', ano_publicacao: 2001, autor_id: autorId, categoria_id: categoriaId }
      ]);
    });

    it('deve buscar livros por autor com token válido', async () => {
      const response = await request(server)
        .get(`/api/livros/autor/${autorId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
    });
  });

  describe('GET /api/livros/categoria/:categoriaId', () => {
    beforeEach(async () => {
      await Livro.bulkCreate([
        { titulo: 'Livro 1', ano_publicacao: 2000, autor_id: autorId, categoria_id: categoriaId },
        { titulo: 'Livro 2', ano_publicacao: 2001, autor_id: autorId, categoria_id: categoriaId }
      ]);
    });

    it('deve buscar livros por categoria com token válido', async () => {
      const response = await request(server)
        .get(`/api/livros/categoria/${categoriaId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
    });
  });

  describe('GET /api/livros/disponiveis', () => {
    beforeEach(async () => {
      await Livro.bulkCreate([
        { titulo: 'Disponível 1', ano_publicacao: 2000, autor_id: autorId, categoria_id: categoriaId, quantidade_disponivel: 5 },
        { titulo: 'Disponível 2', ano_publicacao: 2001, autor_id: autorId, categoria_id: categoriaId, quantidade_disponivel: 3 },
        { titulo: 'Indisponível', ano_publicacao: 2002, autor_id: autorId, categoria_id: categoriaId, quantidade_disponivel: 0 }
      ]);
    });

    it('deve listar apenas livros disponíveis', async () => {
      const response = await request(server)
        .get('/api/livros/disponiveis')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      response.body.data.forEach((livro: any) => {
        expect(livro.quantidade_disponivel).toBeGreaterThan(0);
      });
    });
  });

  describe('GET /api/livros/stats', () => {
    beforeEach(async () => {
      await Livro.bulkCreate([
        { titulo: 'Stats 1', ano_publicacao: 2000, autor_id: autorId, categoria_id: categoriaId, quantidade_disponivel: 5 },
        { titulo: 'Stats 2', ano_publicacao: 2001, autor_id: autorId, categoria_id: categoriaId, quantidade_disponivel: 3 },
        { titulo: 'Stats 3', ano_publicacao: 2002, autor_id: autorId, categoria_id: categoriaId, quantidade_disponivel: 0 }
      ]);
    });

    it('deve retornar estatísticas de livros', async () => {
      const response = await request(server)
        .get('/api/livros/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(3);
      expect(response.body.data.disponiveis).toBe(2);
      expect(response.body.data.indisponiveis).toBe(1);
    });
  });

  describe('POST /api/livros/:id/emprestar', () => {
    beforeEach(async () => {
      const livro = await Livro.create({
        titulo: 'Livro Teste Empréstimo',
        ano_publicacao: 2020,
        quantidade_disponivel: 3,
        autor_id: autorId,
        categoria_id: categoriaId
      });
      livroId = livro.id;
    });

    it('deve permitir usuário comum emprestar livro', async () => {
      const response = await request(server)
        .post(`/api/livros/${livroId}/emprestar`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Livro emprestado com sucesso');

      const livroDB = await Livro.findByPk(livroId);
      expect(livroDB?.quantidade_disponivel).toBe(2);
    });

    it('deve negar empréstimo sem token', async () => {
      const response = await request(server)
        .post(`/api/livros/${livroId}/emprestar`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token de autenticação não fornecido');
    });

    it('deve retornar erro ao emprestar livro sem estoque', async () => {
      await Livro.update(
        { quantidade_disponivel: 0 },
        { where: { id: livroId } }
      );

      const response = await request(server)
        .post(`/api/livros/${livroId}/emprestar`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Livro não disponível para empréstimo');
    });
  });

  describe('POST /api/livros/:id/devolver', () => {
    beforeEach(async () => {
      const livro = await Livro.create({
        titulo: 'Livro Teste Devolução',
        ano_publicacao: 2020,
        quantidade_disponivel: 3,
        autor_id: autorId,
        categoria_id: categoriaId
      });
      livroId = livro.id;
    });

    it('deve permitir usuário comum devolver livro', async () => {
      const response = await request(server)
        .post(`/api/livros/${livroId}/devolver`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Livro devolvido com sucesso');

      const livroDB = await Livro.findByPk(livroId);
      expect(livroDB?.quantidade_disponivel).toBe(4);
    });
  });

  describe('Fluxo completo de operações', () => {
    it('deve executar fluxo completo de empréstimo e devolução com diferentes perfis', async () => {
      // 1. Admin cria livro
      const createResponse = await request(server)
        .post('/api/livros')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titulo: 'Livro Fluxo Completo',
          ano_publicacao: 2020,
          quantidade_disponivel: 2,
          autor_id: autorId,
          categoria_id: categoriaId
        })
        .expect(201);

      const id = createResponse.body.data.id;
      expect(createResponse.body.data.quantidade_disponivel).toBe(2);

      // 2. Usuário comum empresta livro
      await request(server)
        .post(`/api/livros/${id}/emprestar`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      let livroDB = await Livro.findByPk(id);
      expect(livroDB?.quantidade_disponivel).toBe(1);

      // 3. Usuário comum devolve livro
      await request(server)
        .post(`/api/livros/${id}/devolver`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      livroDB = await Livro.findByPk(id);
      expect(livroDB?.quantidade_disponivel).toBe(2);

      // 4. Admin deleta livro
      await request(server)
        .delete(`/api/livros/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const livroDeletado = await Livro.findByPk(id);
      expect(livroDeletado).toBeNull();
    });
  });
});