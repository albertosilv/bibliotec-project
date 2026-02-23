// tests/integration/autor.test.ts
import request from 'supertest';
import app from '../../app';
import Autor from '../../models/Autor';
import Usuario from '../../models/Usuario';
import sequelize from '../../config/database';
import { Server } from 'http';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { QueryTypes } from 'sequelize';

describe('Integração - Módulo Autor (MySQL)', () => {
  let server: Server;
  let autorId: number;
  let adminToken: string;
  let userToken: string;
  let adminId: number;
  let userId: number;

  beforeAll(async () => {
    // Criar servidor
    await new Promise<void>((resolve) => {
      server = app.listen(3002, () => {
        resolve();
      });
    });

    // Aguardar conexão com banco de dados
    await sequelize.authenticate();
    
    // Limpar banco de dados antes dos testes - desabilitar FK checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await Usuario.destroy({ where: {}, truncate: true });
    await Autor.destroy({ where: {}, truncate: true });
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
    await Autor.destroy({ where: {}, truncate: true });
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

  // Limpar apenas autores antes de cada teste (usuários permanecem)
  beforeEach(async () => {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await Autor.destroy({ where: {}, truncate: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  });

  describe('POST /api/autores', () => {
    it('deve criar um novo autor com sucesso (admin)', async () => {
      const novoAutor = {
        nome: 'Machado de Assis',
        biografia: 'Escritor brasileiro, um dos maiores nomes da literatura nacional',
        data_nascimento: '1839-06-21',
        nacionalidade: 'Brasileira'
      };

      const response = await request(server)
        .post('/api/autores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(novoAutor)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.nome).toBe(novoAutor.nome);
      expect(response.body.data.biografia).toBe(novoAutor.biografia);
      expect(response.body.data.nacionalidade).toBe(novoAutor.nacionalidade);
      expect(response.body.message).toBe('Autor criado com sucesso');

      // Verifica no banco
      const autorDB = await Autor.findByPk(response.body.data.id);
      expect(autorDB).not.toBeNull();
      expect(autorDB?.nome).toBe(novoAutor.nome);
      
      autorId = response.body.data.id;
    });

    it('deve negar criação de autor para usuário não-admin', async () => {
      const novoAutor = {
        nome: 'Clarice Lispector',
        biografia: 'Escritora brasileira'
      };

      const response = await request(server)
        .post('/api/autores')
        .set('Authorization', `Bearer ${userToken}`)
        .send(novoAutor)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Acesso negado');
    });

    it('deve negar criação sem token', async () => {
      const novoAutor = {
        nome: 'Clarice Lispector'
      };

      const response = await request(server)
        .post('/api/autores')
        .send(novoAutor)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token de autenticação não fornecido');
    });

    it('deve criar autor apenas com campos obrigatórios (admin)', async () => {
      const novoAutor = {
        nome: 'Clarice Lispector'
      };

      const response = await request(server)
        .post('/api/autores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(novoAutor)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nome).toBe(novoAutor.nome);
      expect(response.body.data.biografia).toBeNull();
      expect(response.body.data.data_nascimento).toBeNull();
      expect(response.body.data.nacionalidade).toBeNull();
    });

    it('deve retornar erro quando nome não é informado (admin)', async () => {
      const response = await request(server)
        .post('/api/autores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          biografia: 'Autor sem nome'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Nome é obrigatório');
    });

    it('deve retornar erro quando nome tem menos de 2 caracteres (admin)', async () => {
      const response = await request(server)
        .post('/api/autores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'A'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('pelo menos 2 caracteres');
    });

    it('deve trimar espaços em branco do nome (admin)', async () => {
      const response = await request(server)
        .post('/api/autores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: '  Guimarães Rosa  '
        })
        .expect(201);

      expect(response.body.data.nome).toBe('Guimarães Rosa');
      
      // Verifica no banco
      const autorDB = await Autor.findByPk(response.body.data.id);
      expect(autorDB?.nome).toBe('Guimarães Rosa');
    });
  });

  describe('GET /api/autores', () => {
    beforeEach(async () => {
      // Cria autores para teste
      await Autor.bulkCreate([
        { nome: 'Machado de Assis', nacionalidade: 'Brasileira' },
        { nome: 'Clarice Lispector', nacionalidade: 'Brasileira' },
        { nome: 'Jorge Amado', nacionalidade: 'Brasileira' },
        { nome: 'Gabriel García Márquez', nacionalidade: 'Colombiana' },
        { nome: 'Jorge Luis Borges', nacionalidade: 'Argentina' }
      ]);
    });

    it('deve listar todos os autores com token válido', async () => {
      const response = await request(server)
        .get('/api/autores')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Autores encontrados com sucesso');
      expect(response.body.data.length).toBe(5);
    });

    it('deve negar listagem sem token', async () => {
      const response = await request(server)
        .get('/api/autores')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token de autenticação não fornecido');
    });

    it('deve listar autores com token de admin', async () => {
      const response = await request(server)
        .get('/api/autores')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(5);
    });
  });

  describe('GET /api/autores/paginated', () => {
    beforeEach(async () => {
      // Cria 15 autores para teste de paginação
      const autores = [];
      for (let i = 1; i <= 15; i++) {
        autores.push({ nome: `Autor ${i}` });
      }
      await Autor.bulkCreate(autores);
    });

    it('deve retornar primeira página com 10 itens por padrão', async () => {
      const response = await request(server)
        .get('/api/autores/paginated')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve retornar segunda página', async () => {
      const response = await request(server)
        .get('/api/autores/paginated?page=2&pageSize=10')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.pagination.hasNextPage).toBe(false);
      expect(response.body.pagination.hasPrevPage).toBe(true);
    });

    it('deve permitir customizar tamanho da página', async () => {
      const response = await request(server)
        .get('/api/autores/paginated?pageSize=5')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.pagination.pageSize).toBe(5);
      expect(response.body.pagination.totalPages).toBe(3);
    });
  });

  describe('GET /api/autores/one/:id', () => {
    beforeEach(async () => {
      const autor = await Autor.create({
        nome: 'Machado de Assis',
        biografia: 'Escritor brasileiro',
        nacionalidade: 'Brasileira'
      });
      autorId = autor.id;
    });

    it('deve buscar autor por ID com sucesso', async () => {
      const response = await request(server)
        .get(`/api/autores/one/${autorId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(autorId);
      expect(response.body.data.nome).toBe('Machado de Assis');
    });
  });

  describe('PUT /api/autores/:id', () => {
    beforeEach(async () => {
      const autor = await Autor.create({
        nome: 'Machado de Assis',
        biografia: 'Biografia antiga',
        nacionalidade: 'Brasileira'
      });
      autorId = autor.id;
    });

    it('deve atualizar autor com sucesso (admin)', async () => {
      const response = await request(server)
        .put(`/api/autores/${autorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Machado de Assis Atualizado',
          biografia: 'Nova biografia'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
     
    });
  });

  describe('DELETE /api/autores/:id', () => {
    beforeEach(async () => {
      const autor = await Autor.create({
        nome: 'Autor para deletar'
      });
      autorId = autor.id;
    });

    it('deve deletar autor com sucesso (admin)', async () => {
      const response = await request(server)
        .delete(`/api/autores/${autorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Autor deletado com sucesso');
    });
  });

  describe('GET /api/autores/search', () => {
    beforeEach(async () => {
      await Autor.bulkCreate([
        { nome: 'Machado de Assis' },
        { nome: 'Clarice Lispector' },
        { nome: 'Jorge Amado' },
        { nome: 'Jorge Luis Borges' },
        { nome: 'Gabriel García Márquez' }
      ]);
    });

    it('deve buscar autores por nome', async () => {
      const response = await request(server)
        .get('/api/autores/search?nome=Jorge')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.map((a: any) => a.nome)).toEqual(
        expect.arrayContaining(['Jorge Amado', 'Jorge Luis Borges'])
      );
    });
  });

  describe('GET /api/autores/estatisticas', () => {
    beforeEach(async () => {
      await Autor.bulkCreate([
        { nome: 'Autor 1' },
        { nome: 'Autor 2' },
        { nome: 'Autor 3' }
      ]);
    });

    it('deve retornar total de autores', async () => {
      const response = await request(server)
        .get('/api/autores/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Estatísticas encontradas');
      expect(response.body.data.total).toBe(3);
    });
  });
});