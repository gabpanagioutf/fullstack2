CREATE DATABASE IF NOT EXISTS financas_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE financas_db;

DROP TABLE IF EXISTS lancamentos;
DROP TABLE IF EXISTS fontes_destinos;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(120) NOT NULL,
  email       VARCHAR(160) NOT NULL UNIQUE,
  cpf         CHAR(11)     NOT NULL UNIQUE,
  senha_hash  VARCHAR(100) NOT NULL,
  criado_em   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE categorias (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT         NOT NULL,
  nome        VARCHAR(60) NOT NULL,
  tipo        ENUM('entrada', 'saida') NOT NULL,
  classificacao ENUM('necessidade', 'desejo', 'poupanca') NOT NULL DEFAULT 'necessidade',
  CONSTRAINT fk_categorias_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY uq_categoria_usuario_nome_tipo (usuario_id, nome, tipo)
) ENGINE=InnoDB;

CREATE TABLE fontes_destinos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id      INT         NOT NULL,
  nome            VARCHAR(60) NOT NULL,
  tipo            ENUM('renda', 'conta', 'cartao_credito') NOT NULL,
  dia_fechamento  TINYINT UNSIGNED NULL,
  dia_vencimento  TINYINT UNSIGNED NULL,
  limite          DECIMAL(12, 2)   NULL,
  reserva         BOOLEAN          NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_fontes_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY uq_fonte_usuario_nome (usuario_id, nome),
  CONSTRAINT chk_dias_cartao CHECK (
    (dia_fechamento IS NULL OR (dia_fechamento BETWEEN 1 AND 31)) AND
    (dia_vencimento IS NULL OR (dia_vencimento BETWEEN 1 AND 31))
  ),
  CONSTRAINT chk_campos_cartao CHECK (
    tipo <> 'cartao_credito' OR
    (dia_fechamento IS NOT NULL AND dia_vencimento IS NOT NULL AND limite IS NOT NULL AND limite > 0)
  )
) ENGINE=InnoDB;

CREATE TABLE lancamentos (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id          INT            NOT NULL,
  tipo                ENUM('entrada', 'saida') NOT NULL,
  descricao           VARCHAR(120)   NOT NULL,
  valor               DECIMAL(12, 2) NOT NULL,
  data                DATE           NOT NULL,
  categoria_id        INT            NOT NULL,
  fonte_destino_id    INT            NOT NULL,
  parcela_atual       TINYINT UNSIGNED NOT NULL DEFAULT 1,
  total_parcelas      TINYINT UNSIGNED NOT NULL DEFAULT 1,
  grupo_parcelamento  CHAR(36)       NULL,
  criado_em           TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lancamentos_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_lancamentos_categoria
    FOREIGN KEY (categoria_id) REFERENCES categorias(id),
  CONSTRAINT fk_lancamentos_fonte
    FOREIGN KEY (fonte_destino_id) REFERENCES fontes_destinos(id),
  CONSTRAINT chk_valor_positivo CHECK (valor > 0),
  CONSTRAINT chk_parcelas_range CHECK (total_parcelas BETWEEN 1 AND 48 AND parcela_atual BETWEEN 1 AND total_parcelas)
) ENGINE=InnoDB;

CREATE INDEX idx_lancamentos_usuario_data ON lancamentos (usuario_id, data);
CREATE INDEX idx_lancamentos_grupo ON lancamentos (grupo_parcelamento);