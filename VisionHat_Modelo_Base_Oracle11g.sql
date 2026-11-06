-- ============================================================================
-- VISIONHAT - MODELO BASE DE DADOS
-- Compatibilidade: Oracle Database 11g
-- Objetivo: modelo inicial para importacao no Oracle SQL Developer Data Modeler
--           e execucao no Oracle SQL Developer.
--
-- NOTAS DE MODELAGEM
-- 1. Um usuario pode possuir varios dispositivos.
-- 2. Um dispositivo pode gerar varias analises.
-- 3. Uma analise pode estar associada a zero ou uma localizacao.
-- 4. Uma analise pode gerar zero ou varias ocorrencias de obstaculos.
-- 5. Cada ocorrencia pode estar associada a zero ou um tipo de obstaculo.
-- 6. OCORRENCIA representa uma deteccao individual feita em uma analise,
--    e nao necessariamente um problema urbano confirmado ou permanente.
-- 7. A localizacao e opcional para permitir analises sem GPS/permissao.
-- 8. A imagem e armazenada fora do banco; REFERENCIA_IMAGEM guarda seu caminho,
--    URL ou identificador no servico de armazenamento.
-- 9. SENHA_HASH deve receber somente o hash da senha, nunca a senha em texto puro.
-- 10. IDs usam SEQUENCE + TRIGGER por compatibilidade com Oracle 11g.
-- ============================================================================

-- ============================================================================
-- 1. TABELA: USUARIO
-- ============================================================================
CREATE TABLE USUARIO (
    ID_USUARIO   NUMBER(10)        NOT NULL,
    CPF          VARCHAR2(11 CHAR) NOT NULL,
    NOME         VARCHAR2(120 CHAR) NOT NULL,
    EMAIL        VARCHAR2(150 CHAR) NOT NULL,
    SENHA_HASH   VARCHAR2(255 CHAR) NOT NULL,
    DATA_CADASTRO TIMESTAMP        DEFAULT SYSTIMESTAMP NOT NULL,
    STATUS       CHAR(1)           DEFAULT 'A' NOT NULL,

    CONSTRAINT PK_USUARIO PRIMARY KEY (ID_USUARIO),
    CONSTRAINT UK_USUARIO_CPF UNIQUE (CPF),
    CONSTRAINT UK_USUARIO_EMAIL UNIQUE (EMAIL),
    CONSTRAINT CK_USUARIO_CPF CHECK (LENGTH(CPF) = 11),
    CONSTRAINT CK_USUARIO_STATUS CHECK (STATUS IN ('A', 'I'))
);

-- ============================================================================
-- 2. TABELA: DISPOSITIVO
-- Um usuario pode cadastrar mais de um dispositivo/oculos.
-- ============================================================================
CREATE TABLE DISPOSITIVO (
    ID_DISPOSITIVO NUMBER(10)         NOT NULL,
    ID_USUARIO     NUMBER(10)         NOT NULL,
    IDENTIFICADOR  VARCHAR2(80 CHAR)  NOT NULL,
    MODELO         VARCHAR2(80 CHAR)  NOT NULL,
    DATA_CADASTRO  TIMESTAMP          DEFAULT SYSTIMESTAMP NOT NULL,
    STATUS         CHAR(1)            DEFAULT 'A' NOT NULL,

    CONSTRAINT PK_DISPOSITIVO PRIMARY KEY (ID_DISPOSITIVO),
    CONSTRAINT UK_DISP_IDENT UNIQUE (IDENTIFICADOR),
    CONSTRAINT CK_DISP_STATUS CHECK (STATUS IN ('A', 'I'))
);

-- ============================================================================
-- 3. TABELA: LOCALIZACAO
-- Guarda a localizacao aproximada/associada a uma analise. Coordenadas opcionais.
-- ============================================================================
CREATE TABLE LOCALIZACAO (
    ID_LOCALIZACAO NUMBER(10)          NOT NULL,
    UF             CHAR(2)             NOT NULL,
    CIDADE         VARCHAR2(100 CHAR)  NOT NULL,
    BAIRRO         VARCHAR2(100 CHAR),
    LATITUDE       NUMBER(10,7),
    LONGITUDE      NUMBER(10,7),

    CONSTRAINT PK_LOCALIZACAO PRIMARY KEY (ID_LOCALIZACAO),
    CONSTRAINT CK_LOC_LAT CHECK (LATITUDE IS NULL OR LATITUDE BETWEEN -90 AND 90),
    CONSTRAINT CK_LOC_LON CHECK (LONGITUDE IS NULL OR LONGITUDE BETWEEN -180 AND 180),
    CONSTRAINT CK_LOC_COORD CHECK (
        (LATITUDE IS NULL AND LONGITUDE IS NULL)
        OR (LATITUDE IS NOT NULL AND LONGITUDE IS NOT NULL)
    )
);

-- ============================================================================
-- 4. TABELA: HISTORICO_ANALISE
-- Cada linha representa uma captura/processamento de imagem pelo sistema.
-- A localizacao pode nao existir; o resultado textual tambem pode estar vazio
-- enquanto a analise estiver pendente ou tiver falhado.
-- ============================================================================
CREATE TABLE HISTORICO_ANALISE (
    ID_ANALISE          NUMBER(10)          NOT NULL,
    ID_DISPOSITIVO      NUMBER(10)          NOT NULL,
    ID_LOCALIZACAO      NUMBER(10),
    DATA_HORA           TIMESTAMP           DEFAULT SYSTIMESTAMP NOT NULL,
    REFERENCIA_IMAGEM   VARCHAR2(500 CHAR),
    DESCRICAO_IA        VARCHAR2(2000 CHAR),
    MODELO_IA           VARCHAR2(100 CHAR),
    STATUS              VARCHAR2(15 CHAR)   DEFAULT 'PENDENTE' NOT NULL,
    ERRO_PROCESSAMENTO  VARCHAR2(500 CHAR),

    CONSTRAINT PK_HIST_ANALISE PRIMARY KEY (ID_ANALISE),
    CONSTRAINT CK_HA_STATUS CHECK (
        STATUS IN ('PENDENTE', 'PROCESSANDO', 'CONCLUIDA', 'FALHA')
    )
);

-- ============================================================================
-- 5. TABELA: TIPO_OBSTACULO
-- Catalogo reutilizavel de categorias de obstaculos.
-- Nao depende de uma analise especifica.
-- ============================================================================
CREATE TABLE TIPO_OBSTACULO (
    ID_TIPO_OBSTACULO NUMBER(10)          NOT NULL,
    NOME              VARCHAR2(80 CHAR)   NOT NULL,
    DESCRICAO         VARCHAR2(300 CHAR),
    ATIVO             CHAR(1)             DEFAULT 'S' NOT NULL,

    CONSTRAINT PK_TIPO_OBSTACULO PRIMARY KEY (ID_TIPO_OBSTACULO),
    CONSTRAINT UK_TIPO_NOME UNIQUE (NOME),
    CONSTRAINT CK_TIPO_ATIVO CHECK (ATIVO IN ('S', 'N'))
);

-- ============================================================================
-- 6. TABELA: OCORRENCIA
-- Cada linha representa um obstaculo/deteccao identificado em uma analise.
-- Se a IA nao conseguir classificar o tipo, ID_TIPO_OBSTACULO pode ficar nulo.
-- NIVEL_ATENCAO e uma classificacao estimada pelo sistema, nao uma garantia
-- de seguranca ou determinacao precisa do risco real.
-- ============================================================================
CREATE TABLE OCORRENCIA (
    ID_OCORRENCIA      NUMBER(10)          NOT NULL,
    ID_ANALISE         NUMBER(10)          NOT NULL,
    ID_TIPO_OBSTACULO  NUMBER(10),
    DESCRICAO          VARCHAR2(500 CHAR)  NOT NULL,
    NIVEL_ATENCAO      VARCHAR2(15 CHAR)   DEFAULT 'INDETERMINADO' NOT NULL,
    CONFIANCA          NUMBER(5,2),

    CONSTRAINT PK_OCORRENCIA PRIMARY KEY (ID_OCORRENCIA),
    CONSTRAINT CK_OCOR_ATENCAO CHECK (
        NIVEL_ATENCAO IN ('BAIXO', 'MEDIO', 'ALTO', 'INDETERMINADO')
    ),
    CONSTRAINT CK_OCOR_CONF CHECK (CONFIANCA IS NULL OR CONFIANCA BETWEEN 0 AND 100)
);

-- ============================================================================
-- 7. CHAVES ESTRANGEIRAS
-- ============================================================================
ALTER TABLE DISPOSITIVO
    ADD CONSTRAINT FK_DISP_USUARIO
    FOREIGN KEY (ID_USUARIO)
    REFERENCES USUARIO (ID_USUARIO);

ALTER TABLE HISTORICO_ANALISE
    ADD CONSTRAINT FK_HA_DISPOSITIVO
    FOREIGN KEY (ID_DISPOSITIVO)
    REFERENCES DISPOSITIVO (ID_DISPOSITIVO);

ALTER TABLE HISTORICO_ANALISE
    ADD CONSTRAINT FK_HA_LOCALIZACAO
    FOREIGN KEY (ID_LOCALIZACAO)
    REFERENCES LOCALIZACAO (ID_LOCALIZACAO);

ALTER TABLE OCORRENCIA
    ADD CONSTRAINT FK_OCOR_ANALISE
    FOREIGN KEY (ID_ANALISE)
    REFERENCES HISTORICO_ANALISE (ID_ANALISE);

ALTER TABLE OCORRENCIA
    ADD CONSTRAINT FK_OCOR_TIPO
    FOREIGN KEY (ID_TIPO_OBSTACULO)
    REFERENCES TIPO_OBSTACULO (ID_TIPO_OBSTACULO);

-- ============================================================================
-- 8. INDICES PARA COLUNAS DE CHAVES ESTRANGEIRAS
-- Oracle nao cria automaticamente indices nas colunas de FK.
-- ============================================================================
CREATE INDEX IDX_DISP_ID_USUARIO ON DISPOSITIVO (ID_USUARIO);
CREATE INDEX IDX_HA_ID_DISP ON HISTORICO_ANALISE (ID_DISPOSITIVO);
CREATE INDEX IDX_HA_ID_LOCAL ON HISTORICO_ANALISE (ID_LOCALIZACAO);
CREATE INDEX IDX_OC_ID_ANALISE ON OCORRENCIA (ID_ANALISE);
CREATE INDEX IDX_OC_ID_TIPO ON OCORRENCIA (ID_TIPO_OBSTACULO);

-- ============================================================================
-- 9. SEQUENCES (Oracle 11g)
-- ============================================================================
CREATE SEQUENCE SEQ_USUARIO START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_DISPOSITIVO START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_LOCALIZACAO START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_HIST_ANALISE START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_TIPO_OBSTACULO START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_OCORRENCIA START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

-- ============================================================================
-- 10. TRIGGERS PARA PREENCHIMENTO AUTOMATICO DOS IDs (Oracle 11g)
-- Se o INSERT nao informar o ID, o trigger utiliza a sequence correspondente.
-- ============================================================================
CREATE OR REPLACE TRIGGER TRG_USUARIO_BI
BEFORE INSERT ON USUARIO
FOR EACH ROW
WHEN (NEW.ID_USUARIO IS NULL)
BEGIN
    SELECT SEQ_USUARIO.NEXTVAL INTO :NEW.ID_USUARIO FROM DUAL;
END;
/

CREATE OR REPLACE TRIGGER TRG_DISPOSITIVO_BI
BEFORE INSERT ON DISPOSITIVO
FOR EACH ROW
WHEN (NEW.ID_DISPOSITIVO IS NULL)
BEGIN
    SELECT SEQ_DISPOSITIVO.NEXTVAL INTO :NEW.ID_DISPOSITIVO FROM DUAL;
END;
/

CREATE OR REPLACE TRIGGER TRG_LOCALIZACAO_BI
BEFORE INSERT ON LOCALIZACAO
FOR EACH ROW
WHEN (NEW.ID_LOCALIZACAO IS NULL)
BEGIN
    SELECT SEQ_LOCALIZACAO.NEXTVAL INTO :NEW.ID_LOCALIZACAO FROM DUAL;
END;
/

CREATE OR REPLACE TRIGGER TRG_HA_BI
BEFORE INSERT ON HISTORICO_ANALISE
FOR EACH ROW
WHEN (NEW.ID_ANALISE IS NULL)
BEGIN
    SELECT SEQ_HIST_ANALISE.NEXTVAL INTO :NEW.ID_ANALISE FROM DUAL;
END;
/

CREATE OR REPLACE TRIGGER TRG_TIPO_OBST_BI
BEFORE INSERT ON TIPO_OBSTACULO
FOR EACH ROW
WHEN (NEW.ID_TIPO_OBSTACULO IS NULL)
BEGIN
    SELECT SEQ_TIPO_OBSTACULO.NEXTVAL INTO :NEW.ID_TIPO_OBSTACULO FROM DUAL;
END;
/

CREATE OR REPLACE TRIGGER TRG_OCORRENCIA_BI
BEFORE INSERT ON OCORRENCIA
FOR EACH ROW
WHEN (NEW.ID_OCORRENCIA IS NULL)
BEGIN
    SELECT SEQ_OCORRENCIA.NEXTVAL INTO :NEW.ID_OCORRENCIA FROM DUAL;
END;
/

-- ============================================================================
-- 11. COMENTARIOS DO MODELO
-- ============================================================================
COMMENT ON TABLE USUARIO IS 'Pessoas cadastradas para utilizar o VisionHat.';
COMMENT ON COLUMN USUARIO.CPF IS 'Armazenar somente os 11 digitos, sem pontos ou hifen.';
COMMENT ON COLUMN USUARIO.SENHA_HASH IS 'Hash da senha; nunca armazenar senha em texto puro.';
COMMENT ON TABLE DISPOSITIVO IS 'Oculos/dispositivos associados a um usuario.';
COMMENT ON COLUMN DISPOSITIVO.IDENTIFICADOR IS 'Identificador unico do dispositivo cadastrado.';
COMMENT ON TABLE LOCALIZACAO IS 'Localizacao opcional associada ao momento de uma analise.';
COMMENT ON TABLE HISTORICO_ANALISE IS 'Registro de cada captura e processamento de imagem pela IA.';
COMMENT ON COLUMN HISTORICO_ANALISE.REFERENCIA_IMAGEM IS 'Caminho, URL ou chave externa da imagem; nao armazena o arquivo binario.';
COMMENT ON TABLE TIPO_OBSTACULO IS 'Catalogo de categorias de obstaculos.';
COMMENT ON TABLE OCORRENCIA IS 'Uma deteccao individual de obstaculo vinculada a uma analise.';
COMMENT ON COLUMN OCORRENCIA.CONFIANCA IS 'Confianca estimada pela IA em percentual, de 0 a 100; pode ser nula.';
COMMENT ON COLUMN OCORRENCIA.NIVEL_ATENCAO IS 'Classificacao estimada pela IA; nao representa garantia de seguranca.';

-- ============================================================================
-- FIM DO MODELO BASE
-- Para executar no SQL Developer, utilize Run Script (F5), especialmente por
-- causa dos delimitadores '/' dos blocos PL/SQL dos triggers.
-- ============================================================================
