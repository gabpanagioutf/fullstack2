import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { autenticar } from './middlewares/autenticar.js';
import { erroHandler } from './middlewares/erroHandler.js';

import authRoutes from './routes/auth.routes.js';
import categoriasRoutes from './routes/categorias.routes.js';
import fontesDestinosRoutes from './routes/fontesDestinos.routes.js';
import lancamentosRoutes from './routes/lancamentos.routes.js';
import relatoriosRoutes from './routes/relatorios.routes.js';
import { RelatorioModel } from './models/relatorioModel.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// CORS restrito à origem do front-end
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());

// Rota pública de saúde da API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas de autenticação (cadastro e login públicos, /me protegido)
app.use('/api/auth', authRoutes);

// Rotas protegidas por JWT
app.use('/api/categorias', autenticar, categoriasRoutes);
app.use('/api/fontes-destinos', autenticar, fontesDestinosRoutes);
app.use('/api/lancamentos', autenticar, lancamentosRoutes);
app.use('/api/relatorios', autenticar, relatoriosRoutes);

// Alias direto para o Desafio conforme sugestão do enunciado (GET /api/saude-financeira)
app.get('/api/saude-financeira', autenticar, async (req, res, next) => {
  try {
    const dados = await RelatorioModel.saudeFinanceira(req.usuarioId);
    return res.json(dados);
  } catch (err) {
    return next(err);
  }
});

// Middleware centralizado de tratamento de erros
app.use(erroHandler);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});