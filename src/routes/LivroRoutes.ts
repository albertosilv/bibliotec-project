import { Router } from 'express';
import LivroController from '../controllers/LivroController';

const router = Router();
const livroController = new LivroController();

/**
 * @swagger
 * /livros:
 *   get:
 *     summary: Lista todos os livros
 *     tags: [Livros]
 *     responses:
 *       200:
 *         description: Lista de livros retornada com sucesso
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
 *                     $ref: '#/components/schemas/Livro'
 *                 message:
 *                   type: string
 *                   example: "Livros encontrados com sucesso"
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', livroController.getAll);

/**
 * @swagger
 * /livros/paginated:
 *   get:
 *     summary: Lista livros com paginação
 *     tags: [Livros]
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
 *         description: Itens por página
 *     responses:
 *       200:
 *         description: Livros paginados encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Livro'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Parâmetros de paginação inválidos
 */
router.get('/paginated', livroController.getPaginated);

/**
 * @swagger
 * /livros/stats:
 *   get:
 *     summary: Retorna estatísticas dos livros
 *     tags: [Livros]
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     disponiveis:
 *                       type: integer
 *                     indisponiveis:
 *                       type: integer
 *                 message:
 *                   type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/stats', livroController.getStats);

/**
 * @swagger
 * /livros/search:
 *   get:
 *     summary: Busca livros por título
 *     tags: [Livros]
 *     parameters:
 *       - in: query
 *         name: titulo
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Título para busca
 *     responses:
 *       200:
 *         description: Livros encontrados na busca
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Livro'
 *                 message:
 *                   type: string
 *       400:
 *         description: Termo de busca inválido
 */
router.get('/search', livroController.search);

/**
 * @swagger
 * /livros/disponiveis:
 *   get:
 *     summary: Lista livros disponíveis para empréstimo
 *     tags: [Livros]
 *     responses:
 *       200:
 *         description: Livros disponíveis encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Livro'
 *                 message:
 *                   type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/disponiveis', livroController.getDisponiveis);

/**
 * @swagger
 * /livros/autor/{autorId}:
 *   get:
 *     summary: Busca livros por autor
 *     tags: [Livros]
 *     parameters:
 *       - in: path
 *         name: autorId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID do autor
 *     responses:
 *       200:
 *         description: Livros do autor encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Livro'
 *                 message:
 *                   type: string
 *       400:
 *         description: ID de autor inválido
 */
router.get('/autor/:autorId', livroController.getByAutor);

/**
 * @swagger
 * /livros/categoria/{categoriaId}:
 *   get:
 *     summary: Busca livros por categoria
 *     tags: [Livros]
 *     parameters:
 *       - in: path
 *         name: categoriaId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID da categoria
 *     responses:
 *       200:
 *         description: Livros da categoria encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Livro'
 *                 message:
 *                   type: string
 *       400:
 *         description: ID de categoria inválido
 */
router.get('/categoria/:categoriaId', livroController.getByCategoria);

/**
 * @swagger
 * /livros/{id}:
 *   get:
 *     summary: Busca livro por ID
 *     tags: [Livros]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID do livro
 *     responses:
 *       200:
 *         description: Livro encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Livro'
 *                 message:
 *                   type: string
 *       404:
 *         description: Livro não encontrado
 */
router.get('/:id', livroController.getById);

/**
 * @swagger
 * /livros:
 *   post:
 *     summary: Cria um novo livro
 *     tags: [Livros]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - ano_publicacao
 *               - autor_id
 *               - categoria_id
 *             properties:
 *               titulo:
 *                 type: string
 *                 minLength: 2
 *                 example: "Dom Casmurro"
 *               sinopse:
 *                 type: string
 *                 example: "Romance de Machado de Assis"
 *               ano_publicacao:
 *                 type: integer
 *                 minimum: 1000
 *                 maximum: 2100
 *                 example: 1899
 *               quantidade_disponivel:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *                 example: 5
 *               autor_id:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1
 *               categoria_id:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *     responses:
 *       201:
 *         description: Livro criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Livro'
 *                 message:
 *                   type: string
 *       400:
 *         description: Dados inválidos ou faltantes
 */
router.post('/', livroController.create);

/**
 * @swagger
 * /livros/{id}:
 *   put:
 *     summary: Atualiza um livro existente
 *     tags: [Livros]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do livro
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *                 minLength: 2
 *               sinopse:
 *                 type: string
 *               ano_publicacao:
 *                 type: integer
 *               quantidade_disponivel:
 *                 type: integer
 *               autor_id:
 *                 type: integer
 *               categoria_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Livro atualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Livro'
 *                 message:
 *                   type: string
 *       400:
 *         description: Dados inválidos ou nenhum dado fornecido
 */
router.put('/:id', livroController.update);

/**
 * @swagger
 * /livros/{id}:
 *   delete:
 *     summary: Remove um livro
 *     tags: [Livros]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do livro
 *     responses:
 *       200:
 *         description: Livro removido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Não foi possível remover o livro
 */
router.delete('/:id', livroController.delete);

/**
 * @swagger
 * /livros/{id}/emprestar:
 *   post:
 *     summary: Empresta um livro
 *     tags: [Livros]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do livro
 *     responses:
 *       200:
 *         description: Livro emprestado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Não foi possível emprestar o livro
 */
router.post('/:id/emprestar', livroController.emprestar);

/**
 * @swagger
 * /livros/{id}/devolver:
 *   post:
 *     summary: Devolve um livro
 *     tags: [Livros]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do livro
 *     responses:
 *       200:
 *         description: Livro devolvido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Não foi possível devolver o livro
 */
router.post('/:id/devolver', livroController.devolver);

/**
 * @swagger
 * components:
 *   schemas:
 *     Livro:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         titulo:
 *           type: string
 *           example: "Memórias Póstumas de Brás Cubas"
 *         sinopse:
 *           type: string
 *           nullable: true
 *           example: "Romance de Machado de Assis"
 *         ano_publicacao:
 *           type: integer
 *           example: 1881
 *         quantidade_disponivel:
 *           type: integer
 *           example: 3
 *         autor_id:
 *           type: integer
 *           example: 1
 *         categoria_id:
 *           type: integer
 *           example: 3
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - id
 *         - titulo
 *         - ano_publicacao
 *         - autor_id
 *         - categoria_id
 */

export default router;