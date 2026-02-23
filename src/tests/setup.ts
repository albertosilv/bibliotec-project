// tests/integration/setup.ts
import sequelize from '../../src/config/database';
import Autor from '../../src/models/Autor';

process.env.NODE_ENV = 'test';

beforeAll(async () => {
  try {
    
    await sequelize.authenticate();
    console.log('✅ Conexão com MySQL de teste estabelecida.');
    
    // Força recriação das tabelas para testes
    await sequelize.sync();
    console.log('✅ Tabelas recriadas para testes.');
  } catch (error) {
    console.error('❌ Erro ao configurar banco de teste:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    await sequelize.close();
    console.log('✅ Conexão com MySQL de teste fechada.');
  } catch (error) {
    console.error('❌ Erro ao fechar conexão:', error);
  }
});

export default sequelize;