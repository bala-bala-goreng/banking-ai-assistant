-- Phase 1 schema — mirrors README §8 (Database Design).
-- The pgvector extension and vector_store table are prepared here for the
-- Phase-2 knowledge base (README §6.5); no Phase-1 code touches them.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE users (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username      varchar(50)  NOT NULL UNIQUE,
    password_hash varchar(100) NOT NULL,
    pin_hash      varchar(100) NOT NULL,
    full_name     varchar(100) NOT NULL,
    created_at    timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE accounts (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        uuid          NOT NULL REFERENCES users(id),
    account_number varchar(20)   NOT NULL UNIQUE,
    account_type   varchar(20)   NOT NULL,               -- SAVINGS | PAYROLL | BUSINESS
    balance        numeric(18,2) NOT NULL DEFAULT 0,
    currency       varchar(3)    NOT NULL DEFAULT 'IDR',
    status         varchar(20)   NOT NULL DEFAULT 'ACTIVE',
    created_at     timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX idx_accounts_user ON accounts(user_id);

-- Single ledger: every balance mutation writes one row here (README §8).
CREATE TABLE transactions (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id    uuid          NOT NULL REFERENCES accounts(id),
    direction     varchar(6)    NOT NULL,                -- DEBIT | CREDIT
    amount        numeric(18,2) NOT NULL,
    fee           numeric(18,2) NOT NULL DEFAULT 0,
    category      varchar(20)   NOT NULL,                -- TRANSFER | PAYMENT | TOPUP
    ref_no        varchar(30)   NOT NULL UNIQUE,
    description   varchar(200),
    balance_after numeric(18,2) NOT NULL,
    created_at    timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX idx_transactions_account_created ON transactions(account_id, created_at DESC);

-- Drafted by the assistant in Phase 3; table created now so later phases only add code.
CREATE TABLE transaction_intents (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid        NOT NULL REFERENCES users(id),
    kind            varchar(10) NOT NULL,                -- TRANSFER | PAYMENT
    status          varchar(10) NOT NULL DEFAULT 'DRAFT',-- DRAFT | EXECUTED | EXPIRED
    payload         jsonb       NOT NULL,
    chat_message_id uuid,
    expires_at      timestamptz NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE transfers (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id      uuid         NOT NULL REFERENCES transactions(id),
    method              varchar(10)  NOT NULL,           -- BI_FAST | ONLINE | RTGS
    dest_bank_code      varchar(10)  NOT NULL,
    dest_account_number varchar(30)  NOT NULL,
    dest_account_name   varchar(100) NOT NULL,
    note                varchar(200),
    intent_id           uuid REFERENCES transaction_intents(id)
);

CREATE TABLE payments (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id  uuid        NOT NULL REFERENCES transactions(id),
    biller          varchar(20) NOT NULL,                -- INDIHOME | GOPAY
    customer_number varchar(30) NOT NULL,
    customer_name   varchar(100),
    period          varchar(20),
    intent_id       uuid REFERENCES transaction_intents(id)
);

CREATE TABLE beneficiaries (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        uuid         NOT NULL REFERENCES users(id),
    alias          varchar(50)  NOT NULL,
    bank_code      varchar(10)  NOT NULL,
    account_number varchar(30)  NOT NULL,
    account_name   varchar(100) NOT NULL,
    created_at     timestamptz  NOT NULL DEFAULT now(),
    UNIQUE (user_id, bank_code, account_number)
);

CREATE TABLE chat_sessions (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES users(id),
    title      varchar(120),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE chat_messages (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid        NOT NULL REFERENCES chat_sessions(id),
    role       varchar(10) NOT NULL,                     -- USER | ASSISTANT | TOOL
    content    text        NOT NULL,
    tool_calls jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Knowledge base (README §6.5) — managed by Spring AI PgVectorStore in Phase 2.
CREATE TABLE vector_store (
    id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content   text,
    metadata  json,
    embedding vector(1024)   -- bge-m3 dimension
);
CREATE INDEX idx_vector_store_embedding ON vector_store USING hnsw (embedding vector_cosine_ops);
