// tests/integration/emprestimo.test.ts
import request from 'supertest';
import { Server } from 'http';
import app from '../../app';
import Emprestimo from '../../models/Emprestimo';
import Usuario from '../../models/Usuario';
import Livro from '../../models/Livro';
import Autor from '../../models/Autor';
import Categoria from '../../models/Categoria';
import sequelize from '../../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Integração - Módulo Empréstimo (MySQL)', () => {
  let server: Server;
  let emprestimoId: number;
  let adminToken: string;
  let userToken: string;
  let adminId: number;
  let userId: number;
  let livroId: number;
  let autorId: number;
  let categoriaId: number;

  beforeAll(async () => {
    // Criar servidor
    await new Promise<void>((resolve) => {
      server = app.listen(3006, () => {
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
      nome: 'Autor Teste Empréstimos',
      biografia: 'Autor para testes de empréstimos'
    });
    autorId = autor.id;

    const categoria = await Categoria.create({
      nome: 'Categoria Teste Empréstimos',
      descricao: 'Categoria para testes de empréstimos'
    });
    categoriaId = categoria.id;

    // Criar livro para testes
    const livro = await Livro.create({
      titulo: 'Livro Teste Empréstimos',
      ano_publicacao: 2020,
      quantidade_disponivel: 5,
      autor_id: autorId,
      categoria_id: categoriaId
    });
    livroId = livro.id;
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

  // Limpar apenas empréstimos antes de cada teste
  beforeEach(async () => {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await Emprestimo.destroy({ where: {}, truncate: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  });

  describe('POST /api/emprestimos', () => {
    it('deve criar um novo empréstimo com sucesso (admin)', async () => {
      const dataEmprestimo = new Date();
      const dataDevolucao = new Date();
      dataDevolucao.setDate(dataDevolucao.getDate() + 15); // +15 dias

      const novoEmprestimo = {
        usuario_id: userId,
        livro_id: livroId,
        data_emprestimo: dataEmprestimo.toISOString(),
        data_devolucao_prevista: dataDevolucao.toISOString()
      };

      const response = await request(server)
        .post('/api/emprestimos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(novoEmprestimo)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.usuario_id).toBe(userId);
      expect(response.body.data.livro_id).toBe(livroId);
      expect(response.body.data.status).toBe('ativo');
      expect(response.body.message).toBe('Empréstimo criado com sucesso');

      // Verifica no banco
      const emprestimoDB = await Emprestimo.findByPk(response.body.data.id);
      expect(emprestimoDB).not.toBeNull();
      expect(emprestimoDB?.usuario_id).toBe(userId);
      
      emprestimoId = response.body.data.id;
    });

    it('deve permitir usuário comum criar empréstimo', async () => {
      const dataEmprestimo = new Date();
      const dataDevolucao = new Date();
      dataDevolucao.setDate(dataDevolucao.getDate() + 15);

      const novoEmprestimo = {
        usuario_id: userId,
        livro_id: livroId,
        data_emprestimo: dataEmprestimo.toISOString(),
        data_devolucao_prevista: dataDevolucao.toISOString()
      };

      const response = await request(server)
        .post('/api/emprestimos')
        .set('Authorization', `Bearer ${userToken}`)
        .send(novoEmprestimo)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.usuario_id).toBe(userId);
    });

    it('deve negar criação sem token', async () => {
      const novoEmprestimo = {
        usuario_id: userId,
        livro_id: livroId,
        data_emprestimo: new Date().toISOString(),
        data_devolucao_prevista: new Date().toISOString()
      };

      const response = await request(server)
        .post('/api/emprestimos')
        .send(novoEmprestimo)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token de autenticação não fornecido');
    });

    it('deve retornar erro quando usuário não é informado', async () => {
      const response = await request(server)
        .post('/api/emprestimos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          livro_id: livroId,
          data_emprestimo: new Date().toISOString(),
          data_devolucao_prevista: new Date().toISOString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Usuário é obrigatório');
    });

    it('deve retornar erro quando livro não é informado', async () => {
      const response = await request(server)
        .post('/api/emprestimos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          usuario_id: userId,
          data_emprestimo: new Date().toISOString(),
          data_devolucao_prevista: new Date().toISOString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Livro é obrigatório');
    });

    it('deve retornar erro quando livro não tem estoque', async () => {
      // Zera o estoque do livro
      await Livro.update(
        { quantidade_disponivel: 0 },
        { where: { id: livroId } }
      );

      const data = new Date();
data.setDate(data.getDate() + 1);

      const response = await request(server)
        .post('/api/emprestimos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          usuario_id: userId,
          livro_id: livroId,
          data_emprestimo: new Date().toISOString(),
          data_devolucao_prevista:data.toISOString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Erro ao criar empréstimo: Error: Livro não possui quantidade disponivel.');

      // Restaura o estoque
      await Livro.update(
        { quantidade_disponivel: 5 },
        { where: { id: livroId } }
      );
    });
  });

  describe('GET /api/emprestimos', () => {
    beforeEach(async () => {
      // Cria empréstimos para teste
      const emprestimos = [];
      for (let i = 1; i <= 5; i++) {
        emprestimos.push({
          usuario_id: userId,
          livro_id: livroId,
          data_emprestimo: new Date(),
          data_devolucao_prevista: new Date(new Date().setDate(new Date().getDate() + 15)),
          status: 'ativo'
        });
      }
      await Emprestimo.bulkCreate(emprestimos);
    });

    it('deve listar todos os empréstimos com token de admin', async () => {
      const response = await request(server)
        .get('/api/emprestimos')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(5);
      expect(response.body.message).toBe('Empréstimos encontrados com sucesso');
    });


    it('deve negar listagem sem token', async () => {
      const response = await request(server)
        .get('/api/emprestimos')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token de autenticação não fornecido');
    });
  });

  describe('GET /api/emprestimos/paginated', () => {
    beforeEach(async () => {
      // Cria 15 empréstimos para teste de paginação
      const emprestimos = [];
      for (let i = 1; i <= 15; i++) {
        emprestimos.push({
          usuario_id: userId,
          livro_id: livroId,
          data_emprestimo: new Date(),
          data_devolucao_prevista: new Date(new Date().setDate(new Date().getDate() + 15)),
          status: 'ativo'
        });
      }
      await Emprestimo.bulkCreate(emprestimos);
    });

    it('deve retornar primeira página com 10 itens por padrão (admin)', async () => {
      const response = await request(server)
        .get('/api/emprestimos/paginated')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.total).toBe(15);
      expect(response.body.pagination.totalPages).toBe(2);
    });
  });

  describe('GET /api/emprestimos/:id', () => {
    beforeEach(async () => {
      const emprestimo = await Emprestimo.create({
        usuario_id: userId,
        livro_id: livroId,
        data_emprestimo: new Date(),
        data_devolucao_prevista: new Date(new Date().setDate(new Date().getDate() + 15)),
        status: 'ativo'
      });
      emprestimoId = emprestimo.id;
    });

    it('deve permitir admin buscar empréstimo por ID', async () => {
      const response = await request(server)
        .get(`/api/emprestimos/${emprestimoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(emprestimoId);
    });

    it('deve permitir usuário buscar próprio empréstimo', async () => {
      const response = await request(server)
        .get(`/api/emprestimos/${emprestimoId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve retornar erro para empréstimo não encontrado', async () => {
      const response = await request(server)
        .get('/api/emprestimos/999999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Empréstimo não encontrado');
    });
  });

  describe('GET /api/emprestimos/usuario/:usuarioId', () => {
    beforeEach(async () => {
      // Cria empréstimos para o usuário teste
      for (let i = 1; i <= 3; i++) {
        await Emprestimo.create({
          usuario_id: userId,
          livro_id: livroId,
          data_emprestimo: new Date(),
          data_devolucao_prevista: new Date(new Date().setDate(new Date().getDate() + 15)),
          status: 'ativo'
        });
      }

      // Cria empréstimos para outro usuário (admin)
      await Emprestimo.create({
        usuario_id: adminId,
        livro_id: livroId,
        data_emprestimo: new Date(),
        data_devolucao_prevista: new Date(new Date().setDate(new Date().getDate() + 15)),
        status: 'ativo'
      });
    });

    it('deve permitir usuário buscar seus próprios empréstimos', async () => {
      const response = await request(server)
        .get(`/api/emprestimos/usuario/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(3);
    });

    it('deve permitir admin buscar empréstimos de qualquer usuário', async () => {
      const response = await request(server)
        .get(`/api/emprestimos/usuario/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(3);
    });

  });

  describe('GET /api/emprestimos/status/ativos', () => {
    beforeEach(async () => {
      // Cria empréstimos ativos
      for (let i = 1; i <= 3; i++) {
        await Emprestimo.create({
          usuario_id: userId,
          livro_id: livroId,
          data_emprestimo: new Date(),
          data_devolucao_prevista: new Date(new Date().setDate(new Date().getDate() + 15)),
          status: 'ativo'
        });
      }

      // Cria um empréstimo devolvido
      await Emprestimo.create({
        usuario_id: userId,
        livro_id: livroId,
        data_emprestimo: new Date(new Date().setDate(new Date().getDate() - 30)),
        data_devolucao_prevista: new Date(new Date().setDate(new Date().getDate() - 15)),
        data_devolucao_real: new Date(new Date().setDate(new Date().getDate() - 15)),
        status: 'devolvido'
      });
    });

    it('deve listar apenas empréstimos ativos (admin)', async () => {
      const response = await request(server)
        .get('/api/emprestimos/status/ativos')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(3);
      response.body.data.forEach((e: any) => {
        expect(e.status).toBe('ativo');
      });
    });
  });

  describe('GET /api/emprestimos/status/atrasados', () => {
    beforeEach(async () => {
      // Cria empréstimos atrasados (data prevista no passado)
      for (let i = 1; i <= 2; i++) {
        await Emprestimo.create({
          usuario_id: userId,
          livro_id: livroId,
          data_emprestimo: new Date(new Date().setDate(new Date().getDate() - 30)),
          data_devolucao_prevista: new Date(new Date().setDate(new Date().getDate() - 15)),
          status: 'ativo'
        });
      }

      // Cria empréstimos em dia
      await Emprestimo.create({
        usuario_id: userId,
        livro_id: livroId,
        data_emprestimo: new Date(),
        data_devolucao_prevista: new Date(new Date().setDate(new Date().getDate() + 15)),
        status: 'ativo'
      });
    });

    it('deve listar apenas empréstimos atrasados (admin)', async () => {
      const response = await request(server)
        .get('/api/emprestimos/status/atrasados')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
    });
  });

  describe('POST /api/emprestimos/:id/devolver', () => {
    beforeEach(async () => {
      const emprestimo = await Emprestimo.create({
        usuario_id: userId,
        livro_id: livroId,
        data_emprestimo: new Date(),
        data_devolucao_prevista: new Date(new Date().setDate(new Date().getDate() + 15)),
        status: 'ativo'
      });
      emprestimoId = emprestimo.id;
    });

    it('deve registrar devolução com sucesso (admin)', async () => {
      const response = await request(server)
        .post(`/api/emprestimos/${emprestimoId}/devolver`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
     

      // Verifica no banco
      const emprestimoDB = await Emprestimo.findByPk(emprestimoId);
      expect(emprestimoDB?.status).toBe('devolvido');
    });

    it('deve permitir usuário devolver próprio empréstimo', async () => {
      const response = await request(server)
        .post(`/api/emprestimos/${emprestimoId}/devolver`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve retornar erro ao devolver empréstimo já devolvido', async () => {
      // Primeira devolução
      await request(server)
        .post(`/api/emprestimos/${emprestimoId}/devolver`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Segunda tentativa
      const response = await request(server)
        .post(`/api/emprestimos/${emprestimoId}/devolver`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Erro ao registrar devolução: Error: Só é possível devolver empréstimos ativos');
    });
  });

  describe('POST /api/emprestimos/:id/marcar-atrasado', () => {
    beforeEach(async () => {
      const emprestimo = await Emprestimo.create({
        usuario_id: userId,
        livro_id: livroId,
        data_emprestimo: new Date(),
        data_devolucao_prevista: new Date(new Date().setDate(new Date().getDate() + 15)),
        status: 'ativo'
      });
      emprestimoId = emprestimo.id;
    });

    it('deve marcar empréstimo como atrasado (admin)', async () => {
      const response = await request(server)
        .post(`/api/emprestimos/${emprestimoId}/marcar-atrasado`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/emprestimos/com-detalhes', () => {
    beforeEach(async () => {
      await Emprestimo.create({
        usuario_id: userId,
        livro_id: livroId,
        data_emprestimo: new Date(),
        data_devolucao_prevista: new Date(new Date().setDate(new Date().getDate() + 15)),
        status: 'ativo'
      });
    });

    it('deve retornar empréstimos com detalhes de usuário e livro (admin)', async () => {
      const response = await request(server)
        .get('/api/emprestimos/com-detalhes')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0]).toHaveProperty('usuario');
      expect(response.body.data[0]).toHaveProperty('livro');
      expect(response.body.data[0].usuario.nome).toBe('Usuario Teste');
      expect(response.body.data[0].livro.titulo).toBe('Livro Teste Empréstimos');
    });
  });

  describe('GET /api/emprestimos/check/usuario/:usuarioId/ativos', () => {
    beforeEach(async () => {
      // Cria empréstimo ativo
      await Emprestimo.create({
        usuario_id: userId,
        livro_id: livroId,
        data_emprestimo: new Date(),
        data_devolucao_prevista: new Date(new Date().setDate(new Date().getDate() + 15)),
        status: 'ativo'
      });
    });

    it('deve verificar se usuário tem empréstimos ativos (admin)', async () => {
      const response = await request(server)
        .get(`/api/emprestimos/check/usuario/${userId}/ativos`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tem_emprestimos_ativos).toBe(true);
    });

    it('deve permitir usuário verificar seus próprios empréstimos', async () => {
      const response = await request(server)
        .get(`/api/emprestimos/check/usuario/${userId}/ativos`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/emprestimos/check/livro/:livroId/emprestado', () => {
    beforeEach(async () => {
      // Cria empréstimo ativo para o livro
      await Emprestimo.create({
        usuario_id: userId,
        livro_id: livroId,
        data_emprestimo: new Date(),
        data_devolucao_prevista: new Date(new Date().setDate(new Date().getDate() + 15)),
        status: 'ativo'
      });
    });

    it('deve verificar se livro está emprestado (admin)', async () => {
      const response = await request(server)
        .get(`/api/emprestimos/check/livro/${livroId}/emprestado`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.esta_emprestado).toBe(true);
    });

    it('deve permitir usuário comum verificar livro', async () => {
      const response = await request(server)
        .get(`/api/emprestimos/check/livro/${livroId}/emprestado`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });


  describe('Fluxo completo de empréstimo', () => {
    it('deve executar fluxo completo de empréstimo com diferentes perfis', async () => {
      // 1. Admin cria empréstimo
      const createResponse = await request(server)
        .post('/api/emprestimos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          usuario_id: userId,
          livro_id: livroId,
          data_emprestimo: new Date().toISOString(),
          data_devolucao_prevista: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString()
        })
        .expect(201);

      const id = createResponse.body.data.id;
      expect(createResponse.body.data.status).toBe('ativo');

      // 2. Usuário verifica seus empréstimos ativos
      const checkResponse = await request(server)
        .get(`/api/emprestimos/check/usuario/${userId}/ativos`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(checkResponse.body.data.tem_emprestimos_ativos).toBe(true);

      // 3. Admin verifica estatísticas
      const statsResponse = await request(server)
        .get('/api/emprestimos/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(statsResponse.body.data.ativos).toBeGreaterThan(0);

      // 4. Usuário devolve o livro
      await request(server)
        .post(`/api/emprestimos/${id}/devolver`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // 5. Verifica se não há mais empréstimos ativos
      const checkAfterResponse = await request(server)
        .get(`/api/emprestimos/check/usuario/${userId}/ativos`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(checkAfterResponse.body.data.tem_emprestimos_ativos).toBe(false);
    });
  });
});