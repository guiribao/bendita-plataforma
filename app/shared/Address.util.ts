
export async function buscarEnderecoViaCep(cep: string) {
  let cepNumber = cep.replace(/\D/g, '');

  if (cepNumber.length < 8) return;

  let { logradouro, bairro, localidade, uf } = await fetch(
    'https://viacep.com.br/ws/' + encodeURIComponent(cep) + '/json/ '
  ).then(async (response) => await response.json());

  return {
    logradouro,
    bairro,
    cidade: localidade,
    estado: uf,
  };
}
