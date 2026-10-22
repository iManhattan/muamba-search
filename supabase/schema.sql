-- =========================================================================
-- MUAMBA SEARCH - SCHEMA DE BANCO DE DADOS NA NUVEM (SUPABASE / POSTGRESQL)
-- =========================================================================
-- Execute este script no "SQL Editor" do seu painel do Supabase.
-- Ele cria a tabela de lotes salvos (Watchlist Compartilhada), habilita
-- Row Level Security (RLS) permissivo para leitura/escrita e ativa o Realtime.

CREATE TABLE IF NOT EXISTS saved_lotes (
    id TEXT PRIMARY KEY, -- Composto por: edle_numero (ex: '0800100/000001/2026_5')
    edle TEXT NOT NULL,
    numero INTEGER NOT NULL,
    edital TEXT NOT NULL,
    tipo TEXT NOT NULL,
    cidade TEXT NOT NULL,
    permite_pf BOOLEAN NOT NULL DEFAULT true,
    valor_minimo NUMERIC NOT NULL,
    valor_avaliacao NUMERIC NOT NULL DEFAULT 0,
    url_oficial TEXT NOT NULL,
    itens JSONB NOT NULL DEFAULT '[]'::jsonb,
    itens_match JSONB NOT NULL DEFAULT '[]'::jsonb,
    imagens JSONB NOT NULL DEFAULT '[]'::jsonb,
    avisos_erratas JSONB NOT NULL DEFAULT '[]'::jsonb,
    data_inicio_propostas TEXT,
    data_fim_propostas TEXT,
    data_abertura_lances TEXT,
    salvo_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices para buscas ultrarrápidas
CREATE INDEX IF NOT EXISTS idx_saved_lotes_edle_num ON saved_lotes(edle, numero);
CREATE INDEX IF NOT EXISTS idx_saved_lotes_salvo_em ON saved_lotes(salvo_em DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE saved_lotes ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público para a Watchlist Compartilhada
DROP POLICY IF EXISTS "Permitir leitura publica de lotes salvos" ON saved_lotes;
CREATE POLICY "Permitir leitura publica de lotes salvos"
    ON saved_lotes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Permitir insercao publica de lotes salvos" ON saved_lotes;
CREATE POLICY "Permitir insercao publica de lotes salvos"
    ON saved_lotes FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualizacao publica de lotes salvos" ON saved_lotes;
CREATE POLICY "Permitir atualizacao publica de lotes salvos"
    ON saved_lotes FOR UPDATE
    USING (true);

DROP POLICY IF EXISTS "Permitir exclusao publica de lotes salvos" ON saved_lotes;
CREATE POLICY "Permitir exclusao publica de lotes salvos"
    ON saved_lotes FOR DELETE
    USING (true);

-- Habilitar sincronização em tempo real (Supabase Realtime)
-- (Permite que outros aparelhos e abas vejam itens salvos sem dar F5)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'saved_lotes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE saved_lotes;
    END IF;
END $$;
