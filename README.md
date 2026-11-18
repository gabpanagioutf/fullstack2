# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.




# Projeto 2 — Aplicação Full Stack de Controle Financeiro Pessoal

Sistema completo para gestão de finanças pessoais composto por API REST em **Node.js + Express + MySQL** e SPA em **React + Vite**.

## Tecnologias Utilizadas
- **Back-end:** Node.js, Express, `mysql2` (pool de conexões), `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv`, `express-rate-limit`.
- **Banco de Dados:** MySQL 8+ (`DECIMAL(12,2)`, chaves estrangeiras, `UNIQUE`, `CHECK` e transações ACID).
- **Front-end:** React 18, Vite, React Router DOM, Recharts.

## Decisões de Arquitetura
- **Parcelamentos e Faturas:** Cada parcela de uma compra no cartão de crédito é gravada como um lançamento individual dentro de uma transação SQL, compartilhando `grupo_parcelamento` e a data original da compra (`data`). O cálculo do mês de fechamento e vencimento é realizado dinamicamente pela função pura `calcularFatura` em `backend/src/config/utils.js`, evitando duplicação e garantindo consistência caso a data da compra seja editada.
- **Divisão em Centavos:** Valores parcelados são convertidos para centavos inteiros; eventuais diferenças de arredondamento são somadas na primeira parcela (`parcela_atual = 1`).

---

## Como Executar o Projeto

### 1. Configurar o Banco de Dados (MySQL)
Execute os scripts de criação das tabelas e carga inicial (2 usuários e 3 meses de movimentações):
```bash
mysql -u root -p < backend/database/schema.sql
mysql -u root -p < backend/database/seed.sql
