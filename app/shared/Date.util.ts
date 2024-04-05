import { differenceInYears, parse } from 'date-fns';
import { da } from 'date-fns/locale';

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

export function parseDateTimeTZ(date, time) {
  let dt;
  
  if(!time) {
    dt = new Date(date + ' 00:00:00 -03');
  } else {
    dt = new Date(date + ' ' + time + ' -03');
  }
  
  return dt;
}

export function verificarIdade(date) {
  return differenceInYears(new Date(), date)
}