// src/routes/categoriaRoutes.ts
import { Router } from 'express';
import CategoriaController from '../controllers/CategoriaController';
import { adminMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const categoriaController = new CategoriaController();

/**
 * @swagger
 * /categorias:
 *   get:
 *     summary: Lista todas as categorias
 *     tags: [Categorias]
 *     description: Retorna todas as categorias cadastradas no sistema
 *     responses:
 *       200:
 *         description: Lista de categorias retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Categoria'
 *                 message:
 *                   type: string
 *                   example: "Categorias encontradas com sucesso"
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', categoriaController.getAll);

/**
 * @swagger
 * /categorias/paginated:
 *   get:
 *     summary: Lista categorias com paginação
 *     tags: [Categorias]
 *     description: Retorna categorias paginadas para listagens grandes
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Número da página
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Quantidade de itens por página
 *     responses:
 *       200:
 *         description: Dados paginados retornados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Categoria'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPrevPage:
 *                       type: boolean
 *                       example: false
 *                 message:
 *                   type: string
 *                   example: "Categorias encontradas com sucesso"
 *       400:
 *         description: Parâmetros de paginação inválidos
 */
router.get('/paginated', categoriaController.getPaginated);

/**
 * @swagger
 * /categorias/{id}:
 *   get:
 *     summary: Busca categoria por ID
 *     tags: [Categorias]
 *     description: Retorna os dados de uma categoria específica pelo seu ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID da categoria
 *     responses:
 *       200:
 *         description: Categoria encontrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Categoria'
 *                 message:
 *                   type: string
 *                   example: "Categoria encontrada com sucesso"
 *       404:
 *         description: Categoria não encontrada
 */
router.get('/:id', categoriaController.getById);

/**
 * @swagger
 * /categorias:
 *   post:
 *     summary: Cria uma nova categoria
 *     tags: [Categorias]
 *     description: Cadastra uma nova categoria no sistema
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *             properties:
 *               nome:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Ficção Científica"
 *                 description: Nome da categoria (mínimo 2 caracteres)
 *               descricao:
 *                 type: string
 *                 example: "Livros que exploram conceitos científicos e tecnológicos"
 *                 description: Descrição detalhada da categoria
 *     responses:
 *       201:
 *         description: Categoria criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Categoria'
 *                 message:
 *                   type: string
 *                   example: "Categoria criada com sucesso"
 *       400:
 *         description: Dados inválidos ou incompletos
 */
router.post('/',adminMiddleware, categoriaController.create);

/**
 * @swagger
 * /categorias/{id}:
 *   put:
 *     summary: Atualiza uma categoria existente
 *     tags: [Categorias]
 *     description: Atualiza os dados de uma categoria pelo seu ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID da categoria a ser atualizada
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Romance Histórico"
 *               descricao:
 *                 type: string
 *                 example: "Obras que se passam em períodos históricos específicos"
 *     responses:
 *       200:
 *         description: Categoria atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Categoria'
 *                 message:
 *                   type: string
 *                   example: "Categoria atualizada com sucesso"
 *       400:
 *         description: Dados inválidos ou nenhum dado fornecido
 *       404:
 *         description: Categoria não encontrada
 */
router.put('/:id',adminMiddleware, categoriaController.update);

/**
 * @swagger
 * /categorias/{id}:
 *   delete:
 *     summary: Remove uma categoria
 *     tags: [Categorias]
 *     description: Exclui uma categoria do sistema pelo seu ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID da categoria a ser removida
 *     responses:
 *       200:
 *         description: Categoria removida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Categoria deletada com sucesso"
 *       400:
 *         description: Não foi possível remover a categoria
 *       404:
 *         description: Categoria não encontrada
 */
router.delete('/:id', categoriaController.delete);

/**
 * @swagger
 * /categorias/search:
 *   get:
 *     summary: Busca categorias por nome
 *     tags: [Categorias]
 *     description: Realiza busca de categorias pelo nome (case-insensitive)
 *     parameters:
 *       - in: query
 *         name: nome
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Termo de busca para o nome da categoria
 *     responses:
 *       200:
 *         description: Busca realizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Categoria'
 *                 message:
 *                   type: string
 *                   example: "Busca realizada com sucesso"
 *       400:
 *         description: Termo de busca inválido ou muito curto
 */
router.get('/search', categoriaController.search);

/**
 * @swagger
 * /categorias/stats:
 *   get:
 *     summary: Estatísticas das categorias
 *     tags: [Categorias]
 *     description: Retorna estatísticas gerais sobre as categorias cadastradas
 *     responses:
 *       200:
 *         description: Estatísticas retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 15
 *                 message:
 *                   type: string
 *                   example: "Estatísticas encontradas"
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/stats', categoriaController.getStats);

/**
 * @swagger
 * components:
 *   schemas:
 *     Categoria:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único da categoria
 *           example: 1
 *         nome:
 *           type: string
 *           description: Nome da categoria
 *           example: "Fantasia"
 *         descricao:
 *           type: string
 *           nullable: true
 *           description: Descrição detalhada da categoria
 *           example: "Livros com elementos mágicos e mundos imaginários"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação do registro
 *           example: "2023-01-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *           example: "2023-01-16T14:20:00.000Z"
 *       required:
 *         - id
 *         - nome
 */

export default router;