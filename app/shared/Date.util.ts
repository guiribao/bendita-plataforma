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
  console.log(date, time);
  let dt = new Date(date + ' ' + time + ' -03');
  console.log(dt);
  return dt;
}
