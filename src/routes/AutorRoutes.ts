import { Router } from 'express';
import AutorController from '../controllers/AutorController';
import { adminMiddleware, authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const autorController = new AutorController();

/**
 * @swagger
 * /autores:
 *   get:
 *     summary: Lista todos os autores (sem paginação)
 *     tags: [Autores]
 *     description: Retorna todos os autores cadastrados no sistema. Ideal para selects em formulários.
 *     responses:
 *       200:
 *         description: Lista de autores retornada com sucesso
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       nome:
 *                         type: string
 *                         example: "Machado de Assis"
 *                       biografia:
 *                         type: string
 *                         nullable: true
 *                         example: "Escritor brasileiro do século XIX"
 *                       data_nascimento:
 *                         type: string
 *                         format: date
 *                         nullable: true
 *                         example: "1839-06-21"
 *                       nacionalidade:
 *                         type: string
 *                         nullable: true
 *                         example: "Brasileira"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 message:
 *                   type: string
 *                   example: "Autores encontrados com sucesso"
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', autorController.getAll);

/**
 * @swagger
 * /autores/paginated:
 *   get:
 *     summary: Lista autores com paginação
 *     tags: [Autores]
 *     description: Retorna autores paginados para listagens grandes
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
 *                     $ref: '#/components/schemas/Autor'
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
 *                       example: 50
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPrevPage:
 *                       type: boolean
 *                       example: false
 *                 message:
 *                   type: string
 *                   example: "Autores encontrados com sucesso"
 *       400:
 *         description: Parâmetros de paginação inválidos
 */
router.get('/paginated', autorController.getPaginated);

/**
 * @swagger
 * /autores/{id}:
 *   get:
 *     summary: Busca autor por ID
 *     tags: [Autores]
 *     description: Retorna os dados de um autor específico pelo seu ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID do autor
 *     responses:
 *       200:
 *         description: Autor encontrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Autor'
 *                 message:
 *                   type: string
 *                   example: "Autor encontrado com sucesso"
 *       404:
 *         description: Autor não encontrado
 */
router.get('/one/:id', autorController.getById);

/**
 * @swagger
 * /autores:
 *   post:
 *     summary: Cria um novo autor
 *     tags: [Autores]
 *     description: Cadastra um novo autor no sistema
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
 *                 example: "Clarice Lispector"
 *                 description: Nome completo do autor (mínimo 2 caracteres)
 *               biografia:
 *                 type: string
 *                 example: "Escritora e jornalista brasileira nascida na Ucrânia"
 *               data_nascimento:
 *                 type: string
 *                 format: date
 *                 example: "1920-12-10"
 *               nacionalidade:
 *                 type: string
 *                 example: "Brasileira"
 *     responses:
 *       201:
 *         description: Autor criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Autor'
 *                 message:
 *                   type: string
 *                   example: "Autor criado com sucesso"
 *       400:
 *         description: Dados inválidos ou incompletos
 */
router.post('/',adminMiddleware, autorController.create);

/**
 * @swagger
 * /autores/{id}:
 *   put:
 *     summary: Atualiza um autor existente
 *     tags: [Autores]
 *     description: Atualiza os dados de um autor pelo seu ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID do autor a ser atualizado
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
 *                 example: "Carlos Drummond de Andrade"
 *               biografia:
 *                 type: string
 *                 example: "Poeta, contista e cronista brasileiro"
 *               data_nascimento:
 *                 type: string
 *                 format: date
 *                 example: "1902-10-31"
 *               nacionalidade:
 *                 type: string
 *                 example: "Brasileira"
 *     responses:
 *       200:
 *         description: Autor atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Autor'
 *                 message:
 *                   type: string
 *                   example: "Autor atualizado com sucesso"
 *       400:
 *         description: Dados inválidos ou nenhum dado fornecido
 *       404:
 *         description: Autor não encontrado
 */
router.put('/:id',adminMiddleware, autorController.update);

/**
 * @swagger
 * /autores/{id}:
 *   delete:
 *     summary: Remove um autor
 *     tags: [Autores]
 *     description: Exclui um autor do sistema pelo seu ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID do autor a ser removido
 *     responses:
 *       200:
 *         description: Autor removido com sucesso
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
 *                   example: "Autor deletado com sucesso"
 *       400:
 *         description: Não foi possível remover o autor
 *       404:
 *         description: Autor não encontrado
 */
router.delete('/:id', autorController.delete);

/**
 * @swagger
 * /autores/search:
 *   get:
 *     summary: Busca autores por nome
 *     tags: [Autores]
 *     description: Realiza busca de autores pelo nome (case-insensitive)
 *     parameters:
 *       - in: query
 *         name: nome
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Termo de busca para o nome do autor
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
 *                     $ref: '#/components/schemas/Autor'
 *                 message:
 *                   type: string
 *                   example: "Busca realizada com sucesso"
 *       400:
 *         description: Termo de busca inválido ou muito curto
 */
router.get('/search', autorController.search);

/**
 * @swagger
 * /autores/stats:
 *   get:
 *     summary: Estatísticas dos autores
 *     tags: [Autores]
 *     description: Retorna estatísticas gerais sobre os autores cadastrados
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
 *                       example: 50
 *                 message:
 *                   type: string
 *                   example: "Estatísticas encontradas"
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/stats', autorController.getStats);

/**
 * @swagger
 * components:
 *   schemas:
 *     Autor:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do autor
 *           example: 1
 *         nome:
 *           type: string
 *           description: Nome completo do autor
 *           example: "Jorge Amado"
 *         biografia:
 *           type: string
 *           nullable: true
 *           description: Biografia do autor
 *           example: "Escritor brasileiro da Bahia"
 *         data_nascimento:
 *           type: string
 *           format: date
 *           nullable: true
 *           description: Data de nascimento do autor
 *           example: "1912-08-10"
 *         nacionalidade:
 *           type: string
 *           nullable: true
 *           description: Nacionalidade do autor
 *           example: "Brasileira"
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