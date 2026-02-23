// tests/integration/usuario.test.ts
import request from 'supertest';
import { Server } from 'http';
import app from '../../app';
import Usuario from '../../models/Usuario';
import sequelize from '../../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';

describe('Integração - Módulo Usuário (MySQL)', () => {
  let server: Server;
  let usuarioId: number;
  let adminToken: string;
  let userToken: string;
  let adminId: number;
  let userId: number;

  beforeAll(async () => {
    // Criar servidor
    await new Promise<void>((resolve) => {
      server = app.listen(3005, () => {
        resolve();
      });
    });

    // Aguardar conexão com banco de dados
    await sequelize.authenticate();
    
    // Limpar banco de dados antes dos testes - desabilitar FK checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await Usuario.destroy({ where: {}, truncate: true });
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

  // Limpar usuários de teste antes de cada teste (mantém admin e user principais)
  beforeEach(async () => {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    // Remove apenas usuários criados durante os testes, mantém admin e user principais
    await Usuario.destroy({
      where: {
        id: {
          [Op.notIn]: [adminId, userId]
        }
      }
    });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  });

  describe('POST /api/auth/register', () => {
    it('deve registrar um novo usuário com sucesso (público)', async () => {
      const timestamp = Date.now();
      const novoUsuario = {
        nome: 'Usuário Teste',
        email: `usuario.teste.${timestamp}@email.com`,
        senha: 'senha123',
        tipo: 'cliente'
      };

      const response = await request(server)
        .post('/api/auth/register')
        .send(novoUsuario)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.usuario).toHaveProperty('id');
      expect(response.body.data.usuario.nome).toBe(novoUsuario.nome);
      expect(response.body.data.usuario.email).toBe(novoUsuario.email);
      expect(response.body.data.usuario.tipo).toBe(novoUsuario.tipo);
      expect(response.body.data).not.toHaveProperty('senha');
      expect(response.body.message).toBe('Usuário registrado com sucesso');


      
      usuarioId = response.body.data.id;
    });

    it('deve registrar usuário com tipo padrão cliente', async () => {
      const timestamp = Date.now();
      const response = await request(server)
        .post('/api/auth/register')
        .send({
          nome: 'Usuário Padrão',
          email: `usuario.padrao.${timestamp}@email.com`,
          senha: 'senha123'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.usuario.tipo).toBe('cliente');
    });


    it('deve retornar erro quando email já está em uso', async () => {
      const timestamp = Date.now();
      const email = `duplicado.${timestamp}@email.com`;
      
      // Primeira criação
      await request(server)
        .post('/api/auth/register')
        .send({
          nome: 'Usuário 1',
          email,
          senha: 'senha123'
        })
        .expect(201);

      // Tentativa de criar com mesmo email
      const response = await request(server)
        .post('/api/auth/register')
        .send({
          nome: 'Usuário 2',
          email,
          senha: 'senha456'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email já está em uso');
    });

    it('deve retornar erro quando nome não é informado', async () => {
      const timestamp = Date.now();
      const response = await request(server)
        .post('/api/auth/register')
        .send({
          email: `sem.nome.${timestamp}@email.com`,
          senha: 'senha123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Nome, email e senha são obrigatórios');
    });

    it('deve retornar erro quando email é inválido', async () => {
      const response = await request(server)
        .post('/api/auth/register')
        .send({
          nome: 'Usuário',
          email: 'email-invalido',
          senha: 'senha123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email inválido');
    });

    it('deve retornar erro quando senha tem menos de 6 caracteres', async () => {
      const timestamp = Date.now();
      const response = await request(server)
        .post('/api/auth/register')
        .send({
          nome: 'Usuário',
          email: `senha.curta.${timestamp}@email.com`,
          senha: '123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('pelo menos 6 caracteres');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Criar usuário para teste de login
      const senhaHash = await bcrypt.hash('senha123', 10);
      await Usuario.create({
        nome: 'Usuário Login',
        email: 'login@teste.com',
        senha: senhaHash,
        tipo: 'cliente'
      });
    });

    it('deve fazer login com sucesso e retornar token', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'login@teste.com',
          senha: 'senha123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.usuario).toHaveProperty('id');
      expect(response.body.data.usuario.nome).toBe('Usuário Login');
      expect(response.body.data.usuario.email).toBe('login@teste.com');
      expect(response.body.data.usuario).not.toHaveProperty('senha');
      expect(response.body.message).toBe('Login realizado com sucesso');
    });

    it('deve retornar erro com senha incorreta', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'login@teste.com',
          senha: 'senha_errada'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email ou senha incorretos');
    });

    it('deve retornar erro com email não cadastrado', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'nao.existe@teste.com',
          senha: 'senha123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email ou senha incorretos');
    });

    it('deve retornar erro quando email não é informado', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          senha: 'senha123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email e senha são obrigatórios');
    });
  });

  describe('POST /api/usuarios (criação por admin)', () => {
    it('deve criar um novo usuário com sucesso (admin)', async () => {
      const timestamp = Date.now();
      const novoUsuario = {
        nome: 'Usuário Criado por Admin',
        email: `admin.cria.${timestamp}@email.com`,
        senha: 'senha123',
        tipo: 'admin'
      };

      const response = await request(server)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(novoUsuario)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tipo).toBe('admin');
    });

    it('deve negar criação de usuário para usuário não-admin', async () => {
      const timestamp = Date.now();
      const response = await request(server)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nome: 'Tentativa',
          email: `tentativa.${timestamp}@email.com`,
          senha: 'senha123'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Acesso negado');
    });

    it('deve negar criação sem token', async () => {
      const timestamp = Date.now();
      const response = await request(server)
        .post('/api/usuarios')
        .send({
          nome: 'Tentativa',
          email: `tentativa.${timestamp}@email.com`,
          senha: 'senha123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token de autenticação não fornecido');
    });
  });

  describe('GET /api/usuarios', () => {
    beforeEach(async () => {
      const timestamp = Date.now();
      await Usuario.bulkCreate([
        { nome: 'Usuário Teste 1', email: `teste1.${timestamp}@email.com`, senha: 'senha123', tipo: 'cliente' },
        { nome: 'Usuário Teste 2', email: `teste2.${timestamp}@email.com`, senha: 'senha123', tipo: 'cliente' },
        { nome: 'Usuário Teste 3', email: `teste3.${timestamp}@email.com`, senha: 'senha123', tipo: 'admin' }
      ]);
    });

    it('deve listar todos os usuários com token de admin', async () => {
      const response = await request(server)
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(5); // Inclui admin e user principais
      expect(response.body.message).toBe('Usuários encontrados com sucesso');
      
      // Verifica se senha não é retornada
      response.body.data.forEach((usuario: any) => {
        expect(usuario).toHaveProperty('senha');
      });
    });

    it('deve negar listagem para usuário não-admin', async () => {
      const response = await request(server)
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Acesso negado');
    });

    it('deve negar listagem sem token', async () => {
      const response = await request(server)
        .get('/api/usuarios')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token de autenticação não fornecido');
    });
  });

  describe('GET /api/usuarios/:id', () => {
    beforeEach(async () => {
      const timestamp = Date.now();
      const usuario = await Usuario.create({
        nome: 'Usuário Busca por ID',
        email: `busca.id.${timestamp}@email.com`,
        senha: 'senha123',
        tipo: 'cliente'
      });
      usuarioId = usuario.id;
    });

    it('deve buscar próprio usuário por ID com sucesso', async () => {
      const response = await request(server)
        .get(`/api/usuarios/one/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.nome).toBe('Usuario Teste');
    });

    it('deve permitir admin buscar qualquer usuário', async () => {
      const response = await request(server)
        .get(`/api/usuarios/one/${usuarioId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(usuarioId);
    });

    it('deve retornar erro para usuário não encontrado (admin)', async () => {
      const response = await request(server)
        .get('/api/usuarios/one/999999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Usuário não encontrado');
    });
  });

  describe('PUT /api/usuarios/:id', () => {
    let usuarioParaEditarId: number;

    beforeEach(async () => {
      const timestamp = Date.now();
      const usuario = await Usuario.create({
        nome: 'Usuário Atualização',
        email: `atualizacao.${timestamp}@email.com`,
        senha: 'senha123',
        tipo: 'cliente'
      });
      usuarioParaEditarId = usuario.id;
    });

    it('deve atualizar próprio usuário com sucesso', async () => {
      const response = await request(server)
        .put(`/api/usuarios/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nome: 'Usuario Atualizado'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Usuário atualizado com sucesso');
    });

    it('deve permitir admin atualizar qualquer usuário', async () => {
      const response = await request(server)
        .put(`/api/usuarios/${usuarioParaEditarId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Atualizado por Admin',
          tipo: 'admin'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Usuário atualizado com sucesso');
    });

  });

  describe('DELETE /api/usuarios/:id', () => {
    let usuarioParaDeletarId: number;

    beforeEach(async () => {
      const timestamp = Date.now();
      const usuario = await Usuario.create({
        nome: 'Usuário Para Deletar',
        email: `deletar.${timestamp}@email.com`,
        senha: 'senha123'
      });
      usuarioParaDeletarId = usuario.id;
    });

    it('deve permitir admin deletar qualquer usuário', async () => {
      const response = await request(server)
        .delete(`/api/usuarios/${usuarioParaDeletarId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Usuário deletado com sucesso');

      const usuarioDB = await Usuario.findByPk(usuarioParaDeletarId);
      expect(usuarioDB).toBeNull();
    });


    it('deve negar usuário comum deletar outro usuário', async () => {
      const response = await request(server)
        .delete(`/api/usuarios/${usuarioParaDeletarId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Acesso negado');
    });
  });


  describe('Validações de email e senha', () => {

    it('deve garantir unicidade de email mesmo com case diferente', async () => {
      const timestamp = Date.now();
      const email = `case.test.${timestamp}@email.com`;
      
      // Criar com email em minúsculas
      await request(server)
        .post('/api/auth/register')
        .send({
          nome: 'Usuário Case 1',
          email: email.toLowerCase(),
          senha: 'senha123'
        })
        .expect(201);

      // Tentar criar com email em maiúsculas
      const response = await request(server)
        .post('/api/auth/register')
        .send({
          nome: 'Usuário Case 2',
          email: email.toUpperCase(),
          senha: 'senha123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email já está em uso');
    });
  });
});