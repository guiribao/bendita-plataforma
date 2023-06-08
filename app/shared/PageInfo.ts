
const infos = [
  {path: '/', title: 'Início'},
  {path: '/dashboard', title: 'Dashboard'}
]


export function getPageInfo(page: string) {
  return infos.find((e) => e.path === page)
}

export function isActivePage(page: string) {
  return !!infos.find((e) => e.path === page)
}