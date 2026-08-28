/**
 * Cria/atualiza contas fixas de teste no banco local, uma por papel,
 * para navegar na aplicação sobre a massa fake gerada pelos testes.
 *
 *   node scripts/seed-contas-locais.mjs
 */
import { prisma, Papel, AssociacaoStatus, cpfFake, telefoneFake } from '../tests/helpers/harness.mjs';

const bcrypt = (await import('bcryptjs')).default;
const SENHA = 'bendita123';

const CONTAS = [
  ['admin@bendita.test', Papel.ADMIN, 'Administradora de Testes'],
  ['secretaria@bendita.test', Papel.SECRETARIA, 'Secretaria de Testes'],
  ['saude@bendita.test', Papel.SAUDE, 'Profissional de Saúde de Testes'],
  ['associado@bendita.test', Papel.ASSOCIADO, 'Associado de Testes'],
];

for (const [email, papel, nome] of CONTAS) {
  const hash = await bcrypt.hash(SENHA, Number(process.env.PASSWORD_SALT) || 10);

  const usuario = await prisma.usuario.upsert({
    where: { email },
    update: { senha: hash, papel },
    create: { email, senha: hash, papel },
  });

  const perfil = await prisma.perfil.upsert({
    where: { usuarioId: usuario.id },
    update: {},
    create: {
      nome_completo: nome,
      apelido: papel.toLowerCase(),
      data_nascimento: '1988-04-12',
      sexo: 'Feminino',
      cpf: cpfFake(),
      rg: '1234567',
      nacionalidade: 'Brasil',
      estado_civil: 'Solteiro(a)',
      telefone: telefoneFake(),
      cep: '89010-000',
      endereco_rua: 'Rua XV de Novembro',
      endereco_numero: '100',
      endereco_bairro: 'Centro',
      endereco_cidade: 'Blumenau',
      endereco_estado: 'SC',
      usuarioId: usuario.id,
    },
  });

  if (papel === Papel.ASSOCIADO && !(await prisma.associado.findUnique({ where: { perfilId: perfil.id } }))) {
    await prisma.associado.create({
      data: {
        perfilId: perfil.id,
        status: AssociacaoStatus.ASSOCIADO,
        tipo_associado: 'MEDICINAL',
        de_acordo_termo_associativo: true,
        de_acordo_termo_associativo_em: new Date(),
        saude_quadro_geral: 'Dores crônicas',
        saude_uso_medicacao: true,
        saude_uso_medicacao_nome: 'Canabidiol',
      },
    });
  }

  console.log(`${papel.padEnd(11)} ${email}`);
}

console.log(`\nSenha de todas as contas: ${SENHA}`);
await prisma.$disconnect();
