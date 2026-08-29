import { redirect } from '@remix-run/node';

export type ResultadoDelecao = { success: boolean; message: string };

/**
 * Volta para a listagem carregando o resultado na URL. Sem isso, uma ação que
 * falha em rota sem componente deixa a tela em branco.
 */
export function redirecionarComResultado(destino: string, resultado: ResultadoDelecao) {
  const parametro = resultado.success ? 'sucesso' : 'erro';
  const url = new URL(destino, 'http://interno');
  url.searchParams.set(parametro, resultado.message);

  return redirect(`${url.pathname}${url.search}`);
}
