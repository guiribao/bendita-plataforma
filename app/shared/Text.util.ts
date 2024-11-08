import { differenceInYears, parse } from 'date-fns';
import { da } from 'date-fns/locale';

export function upperCaseNomes(nome: string): string {
  let partes_nome = nome.split(" ")

  for(let parte in partes_nome) {
    parte = partes_nome[parte].toLowerCase()
    
    if (["de", "da", "dos"].includes(partes_nome[parte])) return
    
    parte = String(partes_nome[parte]).charAt(0).toUpperCase() + String(partes_nome[parte]).slice(1);
  }
  
  return partes_nome.join(" ").trim()
}
