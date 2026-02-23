// tests/integration/categoria.test.ts
import request from 'supertest';
import { Server } from 'http';
import app from '../../app';
import Categoria from '../../models/Categoria';
import Usuario from '../../models/Usuario';
import sequelize from '../../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Integração - Módulo Categoria (MySQL)', () => {
  let server: Server;
  let categoriaId: number;
  let adminToken: string;
  let userToken: string;
  let adminId: number;
  let userId: number;

  beforeAll(async () => {
    // Criar servidor
    await new Promise<void>((resolve) => {
      server = app.listen(3003, () => {
        resolve();
      });
    });

    // Aguardar conexão com banco de dados
    await sequelize.authenticate();
    
    // Limpar banco de dados antes dos testes - desabilitar FK checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await Usuario.destroy({ where: {}, truncate: true });
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
  });

  afterAll(async () => {
    // Limpar dados após os testes - desabilitar FK checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await Usuario.destroy({ where: {}, truncate: true });
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

  // Limpar apenas categorias antes de cada teste (usuários permanecem)
  beforeEach(async () => {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await Categoria.destroy({ where: {}, truncate: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  });

  describe('POST /api/categorias', () => {
    it('deve criar uma nova categoria com sucesso (admin)', async () => {
      const novaCategoria = {
        nome: 'Ficção Científica',
        descricao: 'Livros que exploram conceitos científicos e tecnológicos'
      };

      const response = await request(server)
        .post('/api/categorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(novaCategoria)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.nome).toBe(novaCategoria.nome);
      expect(response.body.data.descricao).toBe(novaCategoria.descricao);
      expect(response.body.message).toBe('Categoria criada com sucesso');

      // Verifica no banco
      const categoriaDB = await Categoria.findByPk(response.body.data.id);
      expect(categoriaDB).not.toBeNull();
      expect(categoriaDB?.nome).toBe(novaCategoria.nome);
      
      categoriaId = response.body.data.id;
    });

    it('deve negar criação de categoria para usuário não-admin', async () => {
      const novaCategoria = {
        nome: 'Fantasia',
        descricao: 'Livros de fantasia'
      };

      const response = await request(server)
        .post('/api/categorias')
        .set('Authorization', `Bearer ${userToken}`)
        .send(novaCategoria)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Acesso negado');
    });

    it('deve negar criação sem token', async () => {
      const novaCategoria = {
        nome: 'Fantasia'
      };

      const response = await request(server)
        .post('/api/categorias')
        .send(novaCategoria)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token de autenticação não fornecido');
    });

    it('deve criar categoria apenas com nome (campo obrigatório) (admin)', async () => {
      const novaCategoria = {
        nome: 'Fantasia'
      };

      const response = await request(server)
        .post('/api/categorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(novaCategoria)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nome).toBe(novaCategoria.nome);
      expect(response.body.data.descricao).toBeNull();
    });

    it('deve retornar erro quando nome não é informado (admin)', async () => {
      const response = await request(server)
        .post('/api/categorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          descricao: 'Categoria sem nome'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Nome é obrigatório');
    });

    it('deve retornar erro quando nome tem menos de 2 caracteres (admin)', async () => {
      const response = await request(server)
        .post('/api/categorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'C'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('pelo menos 2 caracteres');
    });

    it('deve trimar espaços em branco do nome e descrição (admin)', async () => {
      const response = await request(server)
        .post('/api/categorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: '  Romance  ',
          descricao: '  Livros de romance e drama  '
        })
        .expect(201);

      expect(response.body.data.nome).toBe('Romance');
      expect(response.body.data.descricao).toBe('Livros de romance e drama');
      
      // Verifica no banco
      const categoriaDB = await Categoria.findByPk(response.body.data.id);
      expect(categoriaDB?.nome).toBe('Romance');
      expect(categoriaDB?.descricao).toBe('Livros de romance e drama');
    });

    it('deve retornar erro ao criar categoria com nome duplicado (admin)', async () => {
      // Primeira criação
      await request(server)
        .post('/api/categorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Terror',
          descricao: 'Descrição única'
        })
        .expect(201);

      // Tentativa de criar com mesmo nome
      const response = await request(server)
        .post('/api/categorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Terror',
          descricao: 'Outra descrição'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Categoria com este nome já existe');
    });
  });

  describe('GET /api/categorias', () => {
    beforeEach(async () => {
      await Categoria.bulkCreate([
        { nome: 'Ação', descricao: 'Livros de ação e aventura' },
        { nome: 'Comédia', descricao: 'Livros de humor' },
        { nome: 'Drama', descricao: 'Livros dramáticos' },
        { nome: 'Suspense', descricao: 'Livros de suspense' },
        { nome: 'Biografia', descricao: 'Biografias e memórias' }
      ]);
    });

    it('deve listar todas as categorias com token válido', async () => {
      const response = await request(server)
        .get('/api/categorias')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(5);
      expect(response.body.message).toBe('Categorias encontradas com sucesso');
    });

    it('deve negar listagem sem token', async () => {
      const response = await request(server)
        .get('/api/categorias')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token de autenticação não fornecido');
    });

    it('deve listar categorias com token de admin', async () => {
      const response = await request(server)
        .get('/api/categorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(5);
    });
  });

  describe('GET /api/categorias/paginated', () => {
    beforeEach(async () => {
      // Cria 15 categorias para teste de paginação
      const categorias = [];
      for (let i = 1; i <= 15; i++) {
        categorias.push({ 
          nome: `Categoria ${i}`,
          descricao: `Descrição da categoria ${i}`
        });
      }
      await Categoria.bulkCreate(categorias);
    });

    it('deve retornar primeira página com 10 itens por padrão', async () => {
      const response = await request(server)
        .get('/api/categorias/paginated')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.pageSize).toBe(10);
      expect(response.body.pagination.total).toBe(15);
      expect(response.body.pagination.totalPages).toBe(2);
      expect(response.body.pagination.hasNextPage).toBe(true);
      expect(response.body.pagination.hasPrevPage).toBe(false);
    });

    it('deve retornar segunda página', async () => {
      const response = await request(server)
        .get('/api/categorias/paginated?page=2&pageSize=10')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.hasNextPage).toBe(false);
      expect(response.body.pagination.hasPrevPage).toBe(true);
    });

    it('deve permitir customizar tamanho da página', async () => {
      const response = await request(server)
        .get('/api/categorias/paginated?pageSize=5')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.pagination.pageSize).toBe(5);
      expect(response.body.pagination.totalPages).toBe(3);
    });

    it('deve negar acesso sem token', async () => {
      const response = await request(server)
        .get('/api/categorias/paginated')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token de autenticação não fornecido');
    });
  });

  describe('GET /api/categorias/one/:id', () => {
    beforeEach(async () => {
      const categoria = await Categoria.create({
        nome: 'Romance Histórico',
        descricao: 'Romances que se passam em períodos históricos'
      });
      categoriaId = categoria.id;
    });

    it('deve buscar categoria por ID com sucesso', async () => {
      const response = await request(server)
        .get(`/api/categorias/one/${categoriaId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(categoriaId);
      expect(response.body.data.nome).toBe('Romance Histórico');
      expect(response.body.data.descricao).toBe('Romances que se passam em períodos históricos');
      expect(response.body.message).toBe('Categoria encontrada com sucesso');
    });

    it('deve negar acesso sem token', async () => {
      const response = await request(server)
        .get(`/api/categorias/one/${categoriaId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token de autenticação não fornecido');
    });

    it('deve retornar erro para categoria não encontrada', async () => {
      const response = await request(server)
        .get('/api/categorias/one/999999999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Categoria não encontrada');
    });
  });

  describe('PUT /api/categorias/:id', () => {
    beforeEach(async () => {
      const categoria = await Categoria.create({
        nome: 'Ficção Científica',
        descricao: 'Descrição antiga'
      });
      categoriaId = categoria.id;
    });

    it('deve atualizar categoria com sucesso (admin)', async () => {
      const response = await request(server)
        .put(`/api/categorias/${categoriaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Ficção Científica Atualizada',
          descricao: 'Nova descrição para ficção científica'
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verifica no banco
      const categoriaDB = await Categoria.findByPk(categoriaId);
      expect(categoriaDB?.nome).toBe('Ficção Científica Atualizada');
      expect(categoriaDB?.descricao).toBe('Nova descrição para ficção científica');
    });

    it('deve negar atualização para usuário não-admin', async () => {
      const response = await request(server)
        .put(`/api/categorias/${categoriaId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nome: 'Tentativa de atualização'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Acesso negado');
    });

    it('deve negar atualização sem token', async () => {
      const response = await request(server)
        .put(`/api/categorias/${categoriaId}`)
        .send({
          nome: 'Tentativa sem token'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token de autenticação não fornecido');
    });

    it('deve atualizar apenas campos informados (admin)', async () => {
      const response = await request(server)
        .put(`/api/categorias/${categoriaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          descricao: 'Apenas descrição atualizada'
        })
        .expect(200);
    });

    it('deve retornar erro ao tentar atualizar categoria inexistente (admin)', async () => {
      const response = await request(server)
        .put('/api/categorias/999999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Nome Novo'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Categoria não encontrada');
    });

    it('deve retornar erro ao enviar nome muito curto (admin)', async () => {
      const response = await request(server)
        .put(`/api/categorias/${categoriaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'F'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('pelo menos 2 caracteres');
    });

    it('deve retornar erro ao não enviar dados para atualização (admin)', async () => {
      const response = await request(server)
        .put(`/api/categorias/${categoriaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Nenhum dado fornecido');
    });

    it('deve retornar erro ao tentar atualizar para nome já existente (admin)', async () => {
      // Cria outra categoria
      await Categoria.create({
        nome: 'Existente'
      });

      const response = await request(server)
        .put(`/api/categorias/${categoriaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Existente'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Categoria com este nome já existe');
    });
  });

  describe('DELETE /api/categorias/:id', () => {
    beforeEach(async () => {
      const categoria = await Categoria.create({
        nome: 'Categoria Para Deletar',
        descricao: 'Esta categoria será deletada'
      });
      categoriaId = categoria.id;
    });

    it('deve deletar categoria com sucesso (admin)', async () => {
      const response = await request(server)
        .delete(`/api/categorias/${categoriaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Categoria deletada com sucesso');

      // Verifica no banco
      const categoriaDB = await Categoria.findByPk(categoriaId);
      expect(categoriaDB).toBeNull();
    });

    it('deve negar deleção para usuário não-admin', async () => {
      const response = await request(server)
        .delete(`/api/categorias/${categoriaId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Acesso negado');
    });

    it('deve negar deleção sem token', async () => {
      const response = await request(server)
        .delete(`/api/categorias/${categoriaId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token de autenticação não fornecido');
    });

    it('deve retornar erro ao deletar categoria inexistente (admin)', async () => {
      const response = await request(server)
        .delete('/api/categorias/999999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Categoria não encontrada');
    });
  });

  describe('GET /api/categorias/search', () => {
    beforeEach(async () => {
      await Categoria.bulkCreate([
        { nome: 'Fantasia Épica', descricao: 'Alta fantasia' },
        { nome: 'Fantasia Urbana', descricao: 'Fantasia em cenário urbano' },
        { nome: 'Ficção Científica Hard', descricao: 'Ficção científica com rigor científico' },
        { nome: 'Ficção Científica Soft', descricao: 'Ficção científica com foco social' },
        { nome: 'Romance Policial', descricao: 'Romances de detetive' }
      ]);
    });

    it('deve buscar categorias por nome com token válido', async () => {
      const response = await request(server)
        .get('/api/categorias/search?nome=Fantasia')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.map((c: any) => c.nome)).toEqual(
        expect.arrayContaining(['Fantasia Épica', 'Fantasia Urbana'])
      );
    });

    it('deve negar busca sem token', async () => {
      const response = await request(server)
        .get('/api/categorias/search?nome=Fantasia')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token de autenticação não fornecido');
    });

    it('deve ser case insensitive na busca', async () => {
      const response = await request(server)
        .get('/api/categorias/search?nome=fantasia')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('deve buscar categorias por parte do nome', async () => {
      const response = await request(server)
        .get('/api/categorias/search?nome=Científi')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.map((c: any) => c.nome)).toEqual(
        expect.arrayContaining(['Ficção Científica Hard', 'Ficção Científica Soft'])
      );
    });

    it('deve retornar array vazio quando não encontra resultados', async () => {
      const response = await request(server)
        .get('/api/categorias/search?nome=XYZ123456')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('deve retornar erro quando termo de busca é muito curto', async () => {
      const response = await request(server)
        .get('/api/categorias/search?nome=F')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('pelo menos 2 caracteres');
    });

    it('deve retornar erro quando não informa termo de busca', async () => {
      const response = await request(server)
        .get('/api/categorias/search')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Parâmetro de busca é obrigatório');
    });
  });

  describe('GET /api/categorias/stats', () => {
    beforeEach(async () => {
      await Categoria.bulkCreate([
        { nome: 'Stats 1' },
        { nome: 'Stats 2' },
        { nome: 'Stats 3' }
      ]);
    });

    it('deve retornar total de categorias com token válido', async () => {
      const response = await request(server)
        .get('/api/categorias/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(3);
      expect(response.body.message).toBe('Estatísticas encontradas');
    });

    it('deve negar acesso sem token', async () => {
      const response = await request(server)
        .get('/api/categorias/stats')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token de autenticação não fornecido');
    });
  });
});