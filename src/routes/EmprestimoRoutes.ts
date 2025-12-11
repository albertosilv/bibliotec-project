// src/routes/emprestimoRoutes.ts
import { Router } from 'express';
import EmprestimoController from '../controllers/EmprestimoController';

const router = Router();
const emprestimoController = new EmprestimoController();

/**
 * @swagger
 * /emprestimos:
 *   get:
 *     summary: Lista todos os empréstimos
 *     tags: [Empréstimos]
 *     responses:
 *       200:
 *         description: Lista de empréstimos retornada com sucesso
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
 *                     $ref: '#/components/schemas/Emprestimo'
 *                 message:
 *                   type: string
 *                   example: "Empréstimos encontrados com sucesso"
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', emprestimoController.getAll);

/**
 * @swagger
 * /emprestimos/com-detalhes:
 *   get:
 *     summary: Lista empréstimos com detalhes de usuário e livro
 *     tags: [Empréstimos]
 *     responses:
 *       200:
 *         description: Empréstimos com detalhes encontrados
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
 *                     $ref: '#/components/schemas/EmprestimoDetalhado'
 *                 message:
 *                   type: string
 */
router.get('/com-detalhes', emprestimoController.getWithDetails);

/**
 * @swagger
 * /emprestimos/paginated:
 *   get:
 *     summary: Lista empréstimos com paginação
 *     tags: [Empréstimos]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Itens por página
 *     responses:
 *       200:
 *         description: Empréstimos paginados encontrados
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
 *                     $ref: '#/components/schemas/Emprestimo'
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
 */
router.get('/paginated', emprestimoController.getPaginated);

/**
 * @swagger
 * /emprestimos/stats:
 *   get:
 *     summary: Retorna estatísticas dos empréstimos
 *     tags: [Empréstimos]
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
 *                   $ref: '#/components/schemas/EmprestimoStats'
 *                 message:
 *                   type: string
 */
router.get('/stats', emprestimoController.getStats);

/**
 * @swagger
 * /emprestimos/{id}:
 *   get:
 *     summary: Busca empréstimo por ID
 *     tags: [Empréstimos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do empréstimo
 *     responses:
 *       200:
 *         description: Empréstimo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Emprestimo'
 *                 message:
 *                   type: string
 *       404:
 *         description: Empréstimo não encontrado
 */
router.get('/:id', emprestimoController.getById);

/**
 * @swagger
 * /emprestimos/{id}/com-detalhes:
 *   get:
 *     summary: Busca empréstimo por ID com detalhes
 *     tags: [Empréstimos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do empréstimo
 *     responses:
 *       200:
 *         description: Empréstimo com detalhes encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/EmprestimoDetalhado'
 *                 message:
 *                   type: string
 *       404:
 *         description: Empréstimo não encontrado
 */
router.get('/:id/com-detalhes', emprestimoController.getByIdWithDetails);

/**
 * @swagger
 * /emprestimos:
 *   post:
 *     summary: Cria um novo empréstimo
 *     tags: [Empréstimos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usuario_id
 *               - livro_id
 *               - data_emprestimo
 *               - data_devolucao_prevista
 *             properties:
 *               usuario_id:
 *                 type: integer
 *                 example: 1
 *               livro_id:
 *                 type: integer
 *                 example: 5
 *               data_emprestimo:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T10:00:00Z"
 *               data_devolucao_prevista:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-30T10:00:00Z"
 *     responses:
 *       201:
 *         description: Empréstimo criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Emprestimo'
 *                 message:
 *                   type: string
 *       400:
 *         description: Dados inválidos ou faltantes
 */
router.post('/', emprestimoController.create);

/**
 * @swagger
 * /emprestimos/{id}:
 *   put:
 *     summary: Atualiza um empréstimo
 *     tags: [Empréstimos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do empréstimo
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data_devolucao_prevista:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [ativo, devolvido, atrasado]
 *     responses:
 *       200:
 *         description: Empréstimo atualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Emprestimo'
 *                 message:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 */
router.put('/:id', emprestimoController.update);

/**
 * @swagger
 * /emprestimos/{id}:
 *   delete:
 *     summary: Remove um empréstimo
 *     tags: [Empréstimos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do empréstimo
 *     responses:
 *       200:
 *         description: Empréstimo removido
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
 *         description: Não foi possível remover
 */
router.delete('/:id', emprestimoController.delete);

/**
 * @swagger
 * /emprestimos/usuario/{usuarioId}:
 *   get:
 *     summary: Busca empréstimos por usuário
 *     tags: [Empréstimos]
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Empréstimos do usuário encontrados
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
 *                     $ref: '#/components/schemas/Emprestimo'
 *                 message:
 *                   type: string
 */
router.get('/usuario/:usuarioId', emprestimoController.getByUsuario);

/**
 * @swagger
 * /emprestimos/usuario/{usuarioId}/com-detalhes:
 *   get:
 *     summary: Busca empréstimos por usuário com detalhes
 *     tags: [Empréstimos]
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Empréstimos do usuário com detalhes
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
 *                     $ref: '#/components/schemas/EmprestimoDetalhado'
 *                 message:
 *                   type: string
 */
router.get('/usuario/:usuarioId/com-detalhes', emprestimoController.getByUsuarioWithDetails);

/**
 * @swagger
 * /emprestimos/livro/{livroId}:
 *   get:
 *     summary: Busca empréstimos por livro
 *     tags: [Empréstimos]
 *     parameters:
 *       - in: path
 *         name: livroId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do livro
 *     responses:
 *       200:
 *         description: Empréstimos do livro encontrados
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
 *                     $ref: '#/components/schemas/Emprestimo'
 *                 message:
 *                   type: string
 */
router.get('/livro/:livroId', emprestimoController.getByLivro);

/**
 * @swagger
 * /emprestimos/status/ativos:
 *   get:
 *     summary: Lista empréstimos ativos
 *     tags: [Empréstimos]
 *     responses:
 *       200:
 *         description: Empréstimos ativos encontrados
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
 *                     $ref: '#/components/schemas/Emprestimo'
 *                 message:
 *                   type: string
 */
router.get('/status/ativos', emprestimoController.getAtivos);

/**
 * @swagger
 * /emprestimos/status/atrasados:
 *   get:
 *     summary: Lista empréstimos atrasados
 *     tags: [Empréstimos]
 *     responses:
 *       200:
 *         description: Empréstimos atrasados encontrados
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
 *                     $ref: '#/components/schemas/Emprestimo'
 *                 message:
 *                   type: string
 */
router.get('/status/atrasados', emprestimoController.getAtrasados);

/**
 * @swagger
 * /emprestimos/status/{status}:
 *   get:
 *     summary: Busca empréstimos por status específico
 *     tags: [Empréstimos]
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ativo, devolvido, atrasado]
 *         description: Status dos empréstimos
 *     responses:
 *       200:
 *         description: Empréstimos encontrados por status
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
 *                     $ref: '#/components/schemas/Emprestimo'
 *                 message:
 *                   type: string
 */
router.get('/status/:status', emprestimoController.getByStatus);

/**
 * @swagger
 * /emprestimos/check/usuario/{usuarioId}/ativos:
 *   get:
 *     summary: Verifica se usuário tem empréstimos ativos
 *     tags: [Empréstimos]
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Verificação realizada
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
 *                     tem_emprestimos_ativos:
 *                       type: boolean
 *                 message:
 *                   type: string
 */
router.get('/check/usuario/:usuarioId/ativos', emprestimoController.checkUsuarioAtivos);

/**
 * @swagger
 * /emprestimos/check/livro/{livroId}/emprestado:
 *   get:
 *     summary: Verifica se livro está emprestado
 *     tags: [Empréstimos]
 *     parameters:
 *       - in: path
 *         name: livroId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do livro
 *     responses:
 *       200:
 *         description: Verificação realizada
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
 *                     esta_emprestado:
 *                       type: boolean
 *                 message:
 *                   type: string
 */
router.get('/check/livro/:livroId/emprestado', emprestimoController.checkLivroEmprestado);

/**
 * @swagger
 * /emprestimos/{id}/devolver:
 *   post:
 *     summary: Registra devolução de empréstimo
 *     tags: [Empréstimos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do empréstimo
 *     responses:
 *       200:
 *         description: Devolução registrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Emprestimo'
 *                 message:
 *                   type: string
 *       400:
 *         description: Não foi possível registrar devolução
 */
router.post('/:id/devolver', emprestimoController.devolver);

/**
 * @swagger
 * /emprestimos/{id}/marcar-atrasado:
 *   post:
 *     summary: Marca empréstimo como atrasado
 *     tags: [Empréstimos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do empréstimo
 *     responses:
 *       200:
 *         description: Empréstimo marcado como atrasado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Emprestimo'
 *                 message:
 *                   type: string
 *       400:
 *         description: Não foi possível marcar como atrasado
 */
router.post('/:id/marcar-atrasado', emprestimoController.marcarAtrasado);

/**
 * @swagger
 * components:
 *   schemas:
 *     Emprestimo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         usuario_id:
 *           type: integer
 *         livro_id:
 *           type: integer
 *         data_emprestimo:
 *           type: string
 *           format: date-time
 *         data_devolucao_prevista:
 *           type: string
 *           format: date-time
 *         data_devolucao_real:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [ativo, devolvido, atrasado]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     EmprestimoDetalhado:
 *       allOf:
 *         - $ref: '#/components/schemas/Emprestimo'
 *         - type: object
 *           properties:
 *             usuario:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nome:
 *                   type: string
 *                 email:
 *                   type: string
 *             livro:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 titulo:
 *                   type: string
 *                 autor:
 *                   type: string
 *     EmprestimoStats:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *         ativos:
 *           type: integer
 *         devolvidos:
 *           type: integer
 *         atrasados:
 *           type: integer
 */

export default router;