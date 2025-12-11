FROM mysql:8.0

# Definir variáveis de ambiente com valores padrão
ENV MYSQL_ROOT_PASSWORD=root_password_segura
ENV MYSQL_DATABASE=biblioteca_db
ENV MYSQL_USER=biblioteca_user
ENV MYSQL_PASSWORD=biblioteca_pass123

# Diretório para scripts de inicialização
RUN mkdir -p /docker-entrypoint-initdb.d

# Criar arquivo de configuração personalizado SE não quiser usar arquivo externo
# Remova as próximas 2 linhas se for usar arquivo externo
RUN echo '[mysqld]' > /etc/mysql/conf.d/my.cnf && \
    echo 'character-set-server=utf8mb4' >> /etc/mysql/conf.d/my.cnf && \
    echo 'collation-server=utf8mb4_unicode_ci' >> /etc/mysql/conf.d/my.cnf && \
    echo 'default-authentication-plugin=mysql_native_password' >> /etc/mysql/conf.d/my.cnf && \
    echo '[client]' >> /etc/mysql/conf.d/my.cnf && \
    echo 'default-character-set=utf8mb4' >> /etc/mysql/conf.d/my.cnf

# Se quiser usar arquivo externo, comente as linhas acima e descomente abaixo:
# COPY ./mysql-config/my.cnf /etc/mysql/conf.d/
# RUN chmod 644 /etc/mysql/conf.d/my.cnf

# Expor porta padrão do MySQL
EXPOSE 3306

# Health check para verificar se o MySQL está pronto
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=3 \
  CMD mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD} || exit 1