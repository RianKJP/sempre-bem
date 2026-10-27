CREATE DATABASE IF NOT EXISTS sempre-bem;
USE sempre-bem;


-- =========================================================
-- 1. FAMÍLIA
-- =========================================================

CREATE TABLE familia (
    id_familia INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 2. IDOSO
-- =========================================================

CREATE TABLE idoso (
    id_idoso INT AUTO_INCREMENT PRIMARY KEY,
    id_familia INT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    data_nascimento DATE,
    observacoes TEXT,

    CONSTRAINT fk_idoso_familia
        FOREIGN KEY (id_familia)
        REFERENCES familia(id_familia)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- =========================================================
-- 3. CUIDADOR
-- =========================================================

CREATE TABLE cuidador (
    id_cuidador INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,

    tipo_profissional VARCHAR(30) NOT NULL,
    especialidades JSON NOT NULL,
    tempo_experiencia VARCHAR(60) NOT NULL,
    formacao VARCHAR(150) NOT NULL,
    descricao_profissional VARCHAR(600),

    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),

    documentacao_validada BOOLEAN NOT NULL DEFAULT FALSE,
    status_disponibilidade VARCHAR(30) NOT NULL DEFAULT 'DISPONIVEL',

    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 4. DOCUMENTAÇÃO DO CUIDADOR
-- =========================================================

CREATE TABLE documentacao (
    id_documentacao INT AUTO_INCREMENT PRIMARY KEY,
    id_cuidador INT NOT NULL,

    tipo VARCHAR(100) NOT NULL,
    numero VARCHAR(100),
    validade DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',

    enviado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_documentacao_cuidador
        FOREIGN KEY (id_cuidador)
        REFERENCES cuidador(id_cuidador)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- =========================================================
-- 5. LOCALIZAÇÃO
-- =========================================================

CREATE TABLE localizacao (
    id_localizacao INT AUTO_INCREMENT PRIMARY KEY,
    id_cuidador INT NOT NULL,

    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_localizacao_cuidador
        UNIQUE (id_cuidador),

    CONSTRAINT fk_localizacao_cuidador
        FOREIGN KEY (id_cuidador)
        REFERENCES cuidador(id_cuidador)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- =========================================================
-- 6. AGENDA
-- =========================================================

CREATE TABLE agenda (
    id_agenda INT AUTO_INCREMENT PRIMARY KEY,
    id_cuidador INT NOT NULL,

    data DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,

    disponivel BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_agenda_cuidador
        FOREIGN KEY (id_cuidador)
        REFERENCES cuidador(id_cuidador)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- =========================================================
-- 7. SOLICITAÇÃO DE ATENDIMENTO
-- =========================================================

CREATE TABLE solicitacao_atendimento (
    id_solicitacao INT AUTO_INCREMENT PRIMARY KEY,

    id_familia INT NOT NULL,
    id_idoso INT NOT NULL,
    id_cuidador INT NOT NULL,

    data_hora_solicitada DATETIME NOT NULL,
    data_hora_resposta DATETIME,

    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',

    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_solicitacao_familia
        FOREIGN KEY (id_familia)
        REFERENCES familia(id_familia)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_solicitacao_idoso
        FOREIGN KEY (id_idoso)
        REFERENCES idoso(id_idoso)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_solicitacao_cuidador
        FOREIGN KEY (id_cuidador)
        REFERENCES cuidador(id_cuidador)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


-- =========================================================
-- 8. ATENDIMENTO
-- =========================================================

CREATE TABLE atendimento (
    id_atendimento INT AUTO_INCREMENT PRIMARY KEY,

    id_solicitacao INT NOT NULL UNIQUE,

    data_hora_inicio DATETIME,
    data_hora_fim DATETIME,

    status VARCHAR(30) NOT NULL DEFAULT 'AGENDADO',

    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_atendimento_solicitacao
        FOREIGN KEY (id_solicitacao)
        REFERENCES solicitacao_atendimento(id_solicitacao)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


-- =========================================================
-- 9. DIÁRIO DE BORDO
-- =========================================================

CREATE TABLE diario_bordo (
    id_diario INT AUTO_INCREMENT PRIMARY KEY,

    id_atendimento INT NOT NULL UNIQUE,

    data_hora_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observacoes TEXT,

    CONSTRAINT fk_diario_atendimento
        FOREIGN KEY (id_atendimento)
        REFERENCES atendimento(id_atendimento)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- =========================================================
-- 10. MEDICAMENTO
-- =========================================================

CREATE TABLE medicamento (
    id_medicamento INT AUTO_INCREMENT PRIMARY KEY,

    id_diario INT NOT NULL,

    descricao_medicamento VARCHAR(255) NOT NULL,
    horario TIME,
    observacao TEXT,

    CONSTRAINT fk_medicamento_diario
        FOREIGN KEY (id_diario)
        REFERENCES diario_bordo(id_diario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- =========================================================
-- 11. ALIMENTAÇÃO
-- =========================================================

CREATE TABLE alimentacao (
    id_alimentacao INT AUTO_INCREMENT PRIMARY KEY,

    id_diario INT NOT NULL,

    descricao_refeicao VARCHAR(255) NOT NULL,
    horario DATETIME,
    observacao TEXT,

    CONSTRAINT fk_alimentacao_diario
        FOREIGN KEY (id_diario)
        REFERENCES diario_bordo(id_diario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- =========================================================
-- 12. AVALIAÇÃO
-- =========================================================

CREATE TABLE avaliacao (
    id_avaliacao INT AUTO_INCREMENT PRIMARY KEY,

    id_atendimento INT NOT NULL UNIQUE,

    nota TINYINT NOT NULL,
    comentario TEXT,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_avaliacao_nota
        CHECK (nota BETWEEN 1 AND 5),

    CONSTRAINT fk_avaliacao_atendimento
        FOREIGN KEY (id_atendimento)
        REFERENCES atendimento(id_atendimento)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- =========================================================
-- 13. PAGAMENTO
-- =========================================================

CREATE TABLE pagamento (
    id_pagamento INT AUTO_INCREMENT PRIMARY KEY,

    id_atendimento INT NOT NULL UNIQUE,

    valor DECIMAL(10,2) NOT NULL,
    data_pagamento DATETIME,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',

    CONSTRAINT fk_pagamento_atendimento
        FOREIGN KEY (id_atendimento)
        REFERENCES atendimento(id_atendimento)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


-- =========================================================
-- 14. EMERGÊNCIA
-- =========================================================

CREATE TABLE emergencia (
    id_emergencia INT AUTO_INCREMENT PRIMARY KEY,

    id_atendimento INT NOT NULL,

    descricao TEXT NOT NULL,
    data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'ABERTA',

    CONSTRAINT fk_emergencia_atendimento
        FOREIGN KEY (id_atendimento)
        REFERENCES atendimento(id_atendimento)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
