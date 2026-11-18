USE financas_db;

-- Senha de ambos os usuários: Senha123 (hash bcrypt com salt 10)
INSERT INTO usuarios (id, nome, email, cpf, senha_hash) VALUES
(1, 'Ana Silva', 'ana@email.com', '52998224725', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
(2, 'Bruno Costa', 'bruno@email.com', '11144477735', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');

-- Categorias Usuário 1 (Ana)
INSERT INTO categorias (id, usuario_id, nome, tipo, classificacao) VALUES
(1, 1, 'Salário', 'entrada', 'poupanca'),
(2, 1, 'Freelance', 'entrada', 'poupanca'),
(3, 1, 'Moradia', 'saida', 'necessidade'),
(4, 1, 'Alimentação', 'saida', 'necessidade'),
(5, 1, 'Saúde', 'saida', 'necessidade'),
(6, 1, 'Mobilidade', 'saida', 'necessidade'),
(7, 1, 'Lazer', 'saida', 'desejo'),
(8, 1, 'Educação', 'saida', 'necessidade');

-- Categorias Usuário 2 (Bruno - para teste de isolamento)
INSERT INTO categorias (id, usuario_id, nome, tipo, classificacao) VALUES
(9, 2, 'Salário', 'entrada', 'poupanca'),
(10, 2, 'Alimentação', 'saida', 'necessidade');

-- Fontes e Destinos Usuário 1 (Ana)
INSERT INTO fontes_destinos (id, usuario_id, nome, tipo, dia_fechamento, dia_vencimento, limite, reserva) VALUES
(1, 1, 'Empresa Tech Ltda', 'renda', NULL, NULL, NULL, FALSE),
(2, 1, 'Conta Corrente Itaú', 'conta', NULL, NULL, NULL, FALSE),
(3, 1, 'Poupança Reserva', 'conta', NULL, NULL, NULL, TRUE),
(4, 1, 'Cartão Nubank', 'cartao_credito', 3, 10, 5000.00, FALSE),
(5, 1, 'Cartão Visa Infinite', 'cartao_credito', 25, 5, 8000.00, FALSE);

-- Fontes e Destinos Usuário 2 (Bruno)
INSERT INTO fontes_destinos (id, usuario_id, nome, tipo, dia_fechamento, dia_vencimento, limite, reserva) VALUES
(6, 2, 'Conta Santander', 'conta', NULL, NULL, NULL, FALSE);

-- Lançamentos Usuário 1 (3 meses: Setembro, Outubro e Novembro de 2026)
INSERT INTO lancamentos (usuario_id, tipo, descricao, valor, data, categoria_id, fonte_destino_id, parcela_atual, total_parcelas, grupo_parcelamento) VALUES
-- Setembro 2026
(1, 'entrada', 'Salário Mensal', 6500.00, '2026-09-05', 1, 2, 1, 1, NULL),
(1, 'entrada', 'Aporte Reserva', 1000.00, '2026-09-06', 1, 3, 1, 1, NULL),
(1, 'saida', 'Aluguel Apartamento', 1800.00, '2026-09-10', 3, 2, 1, 1, NULL),
(1, 'saida', 'Supermercado Extra', 850.00, '2026-09-12', 4, 4, 1, 1, NULL),
(1, 'saida', 'Combustível e Uber', 420.00, '2026-09-18', 6, 4, 1, 1, NULL),
(1, 'saida', 'Cinema e Restaurante', 390.00, '2026-09-25', 7, 5, 1, 1, NULL),

-- Outubro 2026
(1, 'entrada', 'Salário Mensal', 6500.00, '2026-10-05', 1, 2, 1, 1, NULL),
(1, 'entrada', 'Projeto Web Extra', 1200.00, '2026-10-15', 2, 2, 1, 1, NULL),
(1, 'saida', 'Aluguel Apartamento', 1800.00, '2026-10-10', 3, 2, 1, 1, NULL),
(1, 'saida', 'Supermercado Carrefour', 940.50, '2026-10-14', 4, 4, 1, 1, NULL),
(1, 'saida', 'Farmácia e Consulta', 310.00, '2026-10-19', 5, 2, 1, 1, NULL),
(1, 'saida', 'Curso Full Stack', 450.00, '2026-10-22', 8, 5, 1, 1, NULL),
(1, 'saida', 'Show e Jantar', 680.00, '2026-10-28', 7, 5, 1, 1, NULL),

-- Novembro 2026 (Mês corrente + Compra Parcelada em 4x no Nubank)
(1, 'entrada', 'Salário Mensal', 6500.00, '2026-11-05', 1, 2, 1, 1, NULL),
(1, 'saida', 'Aluguel Apartamento', 1800.00, '2026-11-10', 3, 2, 1, 1, NULL),
(1, 'saida', 'Supermercado Mês', 720.00, '2026-11-02', 4, 4, 1, 1, NULL),
(1, 'saida', 'Abastecimento Carro', 280.00, '2026-11-08', 6, 2, 1, 1, NULL),
(1, 'saida', 'Notebook Dell (4x)', 1000.00, '2026-11-04', 8, 4, 1, 4, '550e8400-e29b-41d4-a716-446655440000'),
(1, 'saida', 'Notebook Dell (4x)', 1000.00, '2026-11-04', 8, 4, 2, 4, '550e8400-e29b-41d4-a716-446655440000'),
(1, 'saida', 'Notebook Dell (4x)', 1000.00, '2026-11-04', 8, 4, 3, 4, '550e8400-e29b-41d4-a716-446655440000'),
(1, 'saida', 'Notebook Dell (4x)', 1000.00, '2026-11-04', 8, 4, 4, 4, '550e8400-e29b-41d4-a716-446655440000');

-- Lançamentos Usuário 2 (Bruno - para provar isolamento)
INSERT INTO lancamentos (usuario_id, tipo, descricao, valor, data, categoria_id, fonte_destino_id) VALUES
(2, 'entrada', 'Salário Bruno', 4000.00, '2026-11-05', 9, 6),
(2, 'saida', 'Almoço Executivo', 55.00, '2026-11-10', 10, 6);