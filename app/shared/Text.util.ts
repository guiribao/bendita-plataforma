
export function upperCaseNomes(nome: string): string {
  let partes_nome = nome.split(" ")

  for(let parte in partes_nome) {
    parte = partes_nome[parte].toLowerCase()
    
    if (["de", "da", "dos"].includes(partes_nome[parte])) return
    
    parte = String(partes_nome[parte]).charAt(0).toUpperCase() + String(partes_nome[parte]).slice(1);
  }
  
  return partes_nome.join(" ").trim()
}

export function createRandom(length = 6) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}