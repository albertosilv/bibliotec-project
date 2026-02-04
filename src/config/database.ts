import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'biblioteca_db',
  username: process.env.DB_USER || 'biblioteca_user',
  password: process.env.DB_PASS || 'biblioteca_pass123',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  dialect: 'mysql',
  dialectOptions: {
    connectTimeout: 60000
  },
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || '10'),
    min: parseInt(process.env.DB_POOL_MIN || '0'),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'),
    idle: parseInt(process.env.DB_POOL_IDLE || '10000')
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true
  },
  retry: {
    max: 3
  }
});

export const testConnection = async (retries = 3): Promise<void> => {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      console.log('✅ Conexão com MySQL Docker estabelecida com sucesso.');
      return;
    } catch (error) {
      console.error(`❌ Tentativa ${i + 1}/${retries} falhou:`, error.message);
      if (i < retries - 1) {
        console.log('🔄 Aguardando 5 segundos antes de tentar novamente...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        throw error;
      }
    }
  }
};


export const syncModels = async (): Promise<void> => {
  try {
    await sequelize.sync({ force: false });
    console.log('✅ Modelos sincronizados com o banco de dados.');
  } catch (error) {
    console.error('❌ Erro ao sincronizar modelos:', error);
    throw error;
  }
};

export default sequelize;