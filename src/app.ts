import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import sequelize, { testConnection, syncModels } from './config/database';

import './models';
import usuarioRoutes from './routes/UsuarioRoutes';
import authRoutes from './routes/AuthRoutes'
import autorRoutes from './routes/AutorRoutes';
import categoriaRoutes from './routes/CategoriaRoutes';
import emprestimoRoutes from './routes/EmprestimoRoutes';
import livroRoutes from './routes/LivroRoutes';
import { authMiddleware } from './middlewares/auth.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Biblioteca API',
      version: '1.0.0',
      description: 'API para sistema de biblioteca'
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Servidor Local'
      }
    ]
  },
  apis: ['./src/routes/*.ts'] 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/auth',authRoutes)
app.use('/usuarios',authMiddleware, usuarioRoutes);
app.use('/autores',authMiddleware, autorRoutes);
app.use('/categorias',authMiddleware, categoriaRoutes);
app.use('/emprestimos',authMiddleware, emprestimoRoutes);
app.use('/livros',authMiddleware, livroRoutes);

interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError;

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    return new Error(String(maybeError));
  }
}

function getErrorMessage(error: unknown) {
  return toErrorWithMessage(error).message;
}

app.get('/', (req, res) => {
  res.json({ 
    message: 'Sistema de Biblioteca API',
    timestamp: new Date().toISOString(),
    documentation: `http://localhost:${PORT}/api-docs`,
    endpoints: {
      usuarios: '/usuarios',
      autores: '/autores',
      categorias: '/categorias',
      emprestimos: '/emprestimos',
      livros: '/livros'
    }
  });
});

app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ 
      status: 'OK', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'disconnected',
      error: getErrorMessage(error)
    });
  }
});

app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

async function initializeApp() {
  try {
    await testConnection();
    
    await syncModels();

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📚 Sistema de Biblioteca API`);
      console.log(`📍 Ambiente: ${process.env.NODE_ENV}`);
      console.log(`🗄️  Banco: ${process.env.DB_NAME || 'biblioteca_db'}`);
      console.log(`📖 Documentação: http://localhost:${PORT}/api-docs`);
      console.log('\n📋 Endpoints disponíveis:');
      console.log(`   👤 Usuários:    http://localhost:${PORT}/usuarios`);
      console.log(`   ✍️  Autores:     http://localhost:${PORT}/autores`);
      console.log(`   📂 Categorias:  http://localhost:${PORT}/categorias`);
      console.log(`   📚 Livros:      http://localhost:${PORT}/livros`);
      console.log(`   🔄 Empréstimos: http://localhost:${PORT}/emprestimos`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar aplicação:', getErrorMessage(error));
    process.exit(1);
  }
}

initializeApp();

export default app;