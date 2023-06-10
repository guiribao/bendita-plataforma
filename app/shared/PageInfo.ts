const infos = [
  { path: '/autentica/entrar', title: ' ' },
  { path: '/autentica/cadastro', title: ' ' },
  { path: '/dashboard', title: 'Dashboard' },
  { path: '/calendario', title: 'Calendário' },
  { path: '/financeiro', title: 'Financeiro' },
  { path: '/gente', title: 'Gente' },
];

export function getPageInfo(page: string) {
  return infos.find((e) => e.path === page);
}

export function isActivePage(page: string) {
  return !!infos.find((e) => e.path === page);
}
