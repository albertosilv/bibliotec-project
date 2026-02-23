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
import recomendacaoRoutes from './routes/RecomendacaoRoutes'
import { adminMiddleware, authMiddleware } from './middlewares/auth.middleware';

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

app.use('/api/auth', authRoutes)
app.use('/api/usuarios', authMiddleware, usuarioRoutes);
app.use('/api/autores', authMiddleware, autorRoutes);
app.use('/api/categorias', authMiddleware, categoriaRoutes);
app.use('/api/emprestimos', authMiddleware, emprestimoRoutes);
app.use('/api/livros', authMiddleware, livroRoutes);
app.use('/api/recomendacoes', authMiddleware, recomendacaoRoutes)

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
      usuarios: '/api/usuarios',
      autores: '/api/autores',
      categorias: '/api/categorias',
      emprestimos: '/api/emprestimos',
      livros: '/api/livros',
      recomendacao: '/api/recomendacao'
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

export async function initializeApp() {
  try {
    await testConnection();

    await syncModels();

  } catch (error) {
    console.error('❌ Erro ao iniciar aplicação:', getErrorMessage(error));
    process.exit(1);
  }
}



export default app;