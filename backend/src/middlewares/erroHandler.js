export function erroHandler(err, req, res, next) {
  console.error('[Erro API]:', err);

  // Erros lançados intencionalmente com status HTTP customizado
  if (err.status) {
    return res.status(err.status).json({
      erro: err.message,
      ...(err.campos ? { campos: err.campos } : {})
    });
  }

  // Violação de unicidade no MySQL (ER_DUP_ENTRY - 1062)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      erro: 'Registro duplicado no banco de dados.'
    });
  }

  // Violação de chave estrangeira ao excluir registro em uso (1451)
  if (err.errno === 1451) {
    return res.status(409).json({
      erro: 'Este registro não pode ser excluído pois possui lançamentos vinculados.'
    });
  }

  return res.status(500).json({
    erro: 'Erro interno no servidor.'
  });
}