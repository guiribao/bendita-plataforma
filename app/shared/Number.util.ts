
export function cortarDecimal(numero, casas) {
  var re = new RegExp('^-?\\d+(?:\.\\d{0,' + (casas || -1) + '})?');
  return numero.toString().match(re)[0];
}

export function substituirPontoDecimalPorVirtgula(aStringNumber) {
  return aStringNumber.replaceAll(".", ",")
}