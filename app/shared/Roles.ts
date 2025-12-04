import { Papel } from '@prisma/client';

export const roles = [
  {
    name: Papel.ADMIN,
    label: 'Administrador',
    icon: 'las la-user-shield',
  },
  {
    name: Papel.SECRETARIA,
    label: 'Secretaria',
    icon: 'las la-book',
  },
  {
    name: Papel.SAUDE,
    label: 'Saúde',
    icon: 'las la-book-medical',
  },
  {
    name: Papel.ASSOCIADO,
    label: 'Associado',
    icon: 'las la-user-cog',
  },
  {
    name: Papel.ASSOCIADO_DEPENDENTE,
    label: 'Dependente',
    icon: 'las la-users-cog',
  },
];
