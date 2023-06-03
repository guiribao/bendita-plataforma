
const infos = [
  {path: '/dashboard', title: 'Dashboard'}
]


export function getPageInfo(page: string) {
  return infos.find((e) => e.path === page)
}