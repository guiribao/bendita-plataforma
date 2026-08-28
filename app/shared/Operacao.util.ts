export function gerarDescricaoOperacaoFeira(operacao: any) {
  let nomeBarraca =
    operacao.feirante?.nome_barraca ||
    `${operacao.feirante?.perfil.nome} ${operacao.feirante?.perfil.sobrenome}`;
  return `${operacao.evento?.titulo} - venda de ${nomeBarraca}`;
}