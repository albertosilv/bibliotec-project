import app, { initializeApp } from "./app";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await initializeApp();

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error("Erro ao iniciar servidor:", error);
    process.exit(1);
  }
}

startServer();