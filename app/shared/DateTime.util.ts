import { differenceInYears, format, isValid, parse } from 'date-fns';

export function brDataFromIsoString(iso: string) {
  return format(parseDateTime(iso), 'dd/MM/yyyy');
}

export function brDisplayDateTime(iso: string) {
  return format(new Date(iso), 'dd/MM/yyyy [*] HH:mm').replace("[*]", "às");
}

export function brStringToIsoString(stringDate: unknown): string | null {
  if (typeof stringDate !== 'string') return null;

  const trimmed = stringDate.trim();
  if (!trimmed) return null;

  // Mascara incompleta (InputMaskClient usa '_' no placeholder)
  if (trimmed.includes('_')) return null;

  // Aceita apenas formato BR dd/MM/yyyy
  const parsed = parse(trimmed, 'dd/MM/yyyy', new Date());

  // Evita datas como 32/13/2020 (parse "corrige" silenciosamente)
  if (!isValid(parsed) || format(parsed, 'dd/MM/yyyy') !== trimmed) return null;

  // Mantem formato ISO de data (sem horario) para compatibilidade com coluna DATE no Postgres
  return format(parsed, 'yyyy-MM-dd');
}

export function addHours(date: Date, hours: number) {
  const hoursToAdd = hours * 60 * 60 * 1000;
  date.setTime(date.getTime() + hoursToAdd);
  return date;
}

export function parseTime(date: Date | string) {
  let date_utc_wrong: Date = new Date(date);
  let date_utc_correct: Date = addHours(date_utc_wrong, 3);

  return date_utc_correct.toLocaleTimeString().slice(0, 5);
}

export function parseDateTime(date: Date | string) {
  let date_utc_wrong: Date = new Date(date);
  let date_utc_correct: Date = addHours(date_utc_wrong, 3);

  return date_utc_correct;
}

export function parseDateTimeTZ(date, time) {
  let dt;

  if (!time) {
    dt = new Date(date + ' 00:00:00 -03');
  } else {
    dt = new Date(date + ' ' + time + ' -03');
  }

  return dt;
}

export function verificarIdade(date: Date | string) {
  return differenceInYears(new Date(), new Date(date));
}
