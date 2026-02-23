// src/routes/recomendacao.routes.ts
import { Router } from "express";
import { RecomendacaoController } from "../controllers/RecomendacaoController";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();
const recomendacaoController = new RecomendacaoController();

router.use(authMiddleware);

router.get("/me", recomendacaoController.getMinhasRecomendacoes);

router.get("/preferencias", recomendacaoController.getMinhasPreferencias);

router.get("/categoria/:categoriaId", recomendacaoController.getRecomendacoesPorCategoria);

router.get("/autor/:autorId", recomendacaoController.getRecomendacoesPorAutor);

router.get("/novo-usuario", recomendacaoController.getRecomendacoesParaNovoUsuario);

export default router;