import { json } from '@remix-run/node';
import type {
  ActionFunction,
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/node';
import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import { authenticator } from '~/secure/authentication.server';
import loading from '~/assets/img/loading.gif';
import perfilEditarPageStyle from '~/assets/css/perfil-editar-page.css';
import { Escolaridade, EstadoCivil, Grupo } from '@prisma/client';
import { ChangeEvent, useEffect, useState } from 'react';
import { parseDateTimeTZ, verificarIdade } from '~/shared/Date.util';
import InputMask from 'react-input-mask';

import Usuario from '~/model/Usuario.server';
import novoPerfil from '~/domain/Perfil/novo-perfil.server';
import successfullyRegistered from '~/assets/img/undraw/successfully-registered.svg';

export const meta: MetaFunction = () => {
  return [
    {
      charset: 'utf-8',
      title: 'Cadastro - ChaveCloud',
      viewport: 'width=device-width, initial-scale=1',
    },
    {
      name: 'description',
      content: 'Cadastrar um perfil na núvem do Chave',
    },
  ];
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: perfilEditarPageStyle }];
};

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();

  const nome: string = form.get('nome') as string;
  const sobrenome: string = form.get('sobrenome') as string;

  const email: string = form.get('email') as string;

  const data_nascimento: string = form.get('data_nascimento') as string;
  const hora_nascimento: string = form.get('hora_nascimento') as string;
  const cidade_nascimento: string = form.get('cidade_nascimento') as string;
  const estado_nascimento: string = form.get('estado_nascimento') as string;

  const registro_geral: string = form.get('rg') as string;
  const cpf: string = form.get('cpf') as string;

  const telefone_fixo: string = form.get('telefone_fixo') as string;
  const celular: string = form.get('celular') as string;

  const cep: string = form.get('cep') as string;
  const endereco: string = form.get('endereco') as string;
  const numero: string = form.get('numero') as string;
  const complemento: string = form.get('complemento') as string;
  const bairro: string = form.get('bairro') as string;
  const cidade: string = form.get('cidade') as string;
  const estado: string = form.get('estado') as string;

  const estado_civil: string = form.get('estado_civil') as string;
  const nome_conjuge: string = form.get('nome_conjuge') as string;

  // TO-DO: Filhos -> nome, data_nascimento, escolaridade
  let filhos: string = form.get('filhos') as string;
  let arrayFilhos: string[] = filhos?.split(',');

  const escolaridade: string = form.get('escolaridade') as string;
  const grupo: Grupo = form.get('grupo') as Grupo;
  const data_fardamento: string = form.get('data_fardamento') as string;
  const local_fardamento: string = form.get('local_fardamento') as string;
  const profissao: string = form.get('profissao') as string;
  const bio: string = form.get('bio') as string;

  const nome_referencia: string = form.get('nome_referencia') as string;
  const telefone_referencia: string = form.get('telefone_referencia') as string;
  const email_referencia: string = form.get('email_referencia') as string;
  const endereco_referencia: string = form.get('endereco_referencia') as string;
  const parentesco_referencia: string = form.get('parentesco_referencia') as string;

  const membro: boolean = (form.get('membro') as string) === 'true';

  const medicacao_controlada: boolean = (form.get('medicacao_controlada') as string) === 'true';
  const nome_medicacao: string = form.get('nome_medicacao') as string;
  const quadro_saude: string = form.get('quadro_saude') as string;
  const primeira_vez: boolean = (form.get('primeira_vez') as string) === 'true';

  let errors = {};

  if ([!nome, !sobrenome, !data_nascimento, !estado_civil, !endereco].some(Boolean)) {
    errors = Object.assign(errors, { data: 'Preencha todos os campos obrigatórios' });
    return json({ errors });
  }

  let data_hora_nascimento = parseDateTimeTZ(data_nascimento, hora_nascimento);

  await novoPerfil({
    nome,
    sobrenome,
    data_hora_nascimento,
    cidade_nascimento,
    estado_nascimento,
    registro_geral,
    cpf,
    foto: 'http://localhost:3000/user.png',
    grupo,
    email,
    telefone_fixo: telefone_fixo.replaceAll(' ', ''),
    celular: celular.replaceAll(' ', ''),
    cep,
    endereco,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    estado_civil,
    nome_conjuge,
    escolaridade,
    data_fardamento,
    local_fardamento,
    membro,
    profissao,
    bio,
    nome_referencia,
    telefone_referencia: telefone_referencia.replaceAll(' ', ''),
    email_referencia,
    endereco_referencia,
    parentesco_referencia,
    medicacao_controlada,
    nome_medicacao,
    quadro_saude,
    primeira_vez,
  });

  return json({ cadastrado: true });
};

export async function loader({ request }: LoaderFunctionArgs) {
  let usuario: Usuario | null = await authenticator.isAuthenticated(request);

  if (usuario) {
    return await authenticator.logout(request, { redirectTo: '/cadastro' });
  }

  let ufs = await fetch(
    'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome'
  ).then((response) => response.json());

  return json({ ufs });
}

export default function VisitanteNovo() {
  const actionData = useActionData();
  let { ufs } = useLoaderData();

  let [validado, setValidado] = useState(false);
  let [validacao, setValidacao] = useState(null);
  let [medicacaoControlada, setMedicacaoControlada] = useState(false);

  let [_cpf, _setCpf] = useState('');
  let [_email, _setEmail] = useState('');
  let [_dataNascimento, _setDataNascimento] = useState('');

  let [estadoCivil, setEstadoCivil] = useState(EstadoCivil.SOLTEIRO);
  let [grupo, setGrupo] = useState(Grupo.VISITANTE);
  let [arrayCidades, setArrayCidades] = useState([]);
  let [endereco, setEndereco] = useState({
    logradouro: '',
    bairro: '',
    cidade: '',
    estado: '',
  });

  const navigation = useNavigation();
  const isSubmitting = ['submitting', 'loading'].includes(navigation.state);

  function handleCpf(e: ChangeEvent<HTMLInputElement>) {
    _setCpf(e.target.value);
  }

  function handleEmail(e: ChangeEvent<HTMLInputElement>) {
    _setEmail(e.target.value);
  }

  function handleDataNascimento(e: ChangeEvent<HTMLInputElement>) {
    _setDataNascimento(e.target.value);
  }

  async function carregarCidades(event) {
    let uf = event.target.value;

    let cidades = await fetch(
      'https://servicodados.ibge.gov.br/api/v1/localidades/estados/' +
        encodeURIComponent(uf) +
        '/municipios'
    );

    setArrayCidades(await cidades.json());
  }

  async function carregarEndereco(event) {
    let cep = event.target.value.replace(/\D/g, '');

    if (cep.length < 8) return;

    let { logradouro, bairro, localidade, uf } = await fetch(
      'https://viacep.com.br/ws/' + encodeURIComponent(cep) + '/json/ '
    ).then(async (response) => await response.json());

    setEndereco({
      logradouro,
      bairro,
      cidade: localidade,
      estado: uf,
    });

    if (!logradouro) {
      let endereco = document.getElementById('endereco');
      endereco?.focus();
      return;
    }

    let numero = document.getElementById('numero');
    numero.value = '';
    numero?.focus();
  }

  async function verificarCadastroExistente(event) {
    let perfil_cpf, perfil_email;

    perfil_cpf = await fetch(`/buscar/perfil/${_cpf}`).then((response) => response.json());

    if (perfil_cpf.perfis.length) {
      console.log(perfil_cpf);
      setValidacao({ mensagem: 'Já existe um cadastro com este CPF.', estilo: 'mensagem-erro' });
      return;
    }

    perfil_email = await fetch(`/buscar/perfil/${_email}`).then((response) => response.json());

    if (perfil_email.perfis.length) {
      setValidacao({ mensagem: 'Já existe um cadastro com este E-mail.', estilo: 'mensagem-erro' });
      return;
    }

    if (verificarIdade(_dataNascimento) < 18) {
      setValidacao({
        mensagem: 'Cadastro permitido apenas para maiores de 18 anos.',
        estilo: 'mensagem-erro',
      });

      document.getElementById('form-cadastro')?.reset();

      return;
    }

    setValidacao({
      mensagem: 'Tudo certo para seguir com seu cadastro.',
      estilo: 'mensagem-sucesso',
    });
    setValidado(true);
  }

  function handleMedicacaoControlada(event) {
    let value = event.target.value === 'true' ? true : false;
    setMedicacaoControlada(value);
  }

  return (
    <main>
      <div className='header cadastro'>
        <h1>Cadastro</h1>
      </div>

      {actionData?.errors?.data && !actionData?.cadastrado && (
        <p className='mensagem-erro'>{actionData?.errors?.data}</p>
      )}
      {validacao && !actionData?.errors && !actionData?.cadastrado && (
        <p className={validacao.estilo}>{validacao.mensagem}</p>
      )}

      {!validado && !actionData?.cadastrado && (
        <Form className='form-perfil' id='form-validacao'>
          <div className='form-group validar-perfil'>
            <div className='form-group-header'>
              <h2>Validação</h2>
              <p>Antes de seguir, vamos validar alguns dados</p>
            </div>

            <div className='form-field'>
              <label htmlFor='valida_cpf'>Seu CPF</label>
              <InputMask
                type='text'
                name='valida_cpf'
                id='valida_cpf'
                defaultValue={''}
                autoComplete='off'
                mask='999.999.999-99'
                maskChar={' '}
                required
                onChange={handleCpf}
              />
            </div>
            <div className='form-field'>
              <label htmlFor='valida_email'>Seu melhor e-mail</label>
              <input
                type='email'
                name='valida_email'
                id='valida_email'
                className='input-email'
                defaultValue={''}
                autoComplete='off'
                onChange={handleEmail}
              />
            </div>
            <div className='form-field'>
              <label htmlFor='valida_data_nascimento'>Data de nascimento</label>
              <input
                type='date'
                name='valida_data_nascimento'
                id='valida_data_nascimento'
                defaultValue={''}
                autoComplete='off'
                required
                onChange={handleDataNascimento}
              />
            </div>
            <div className='form-field-full'>
              <p>
                Seguimos os termos da Resolução nº 05/04, do CONAD, que orienta que o uso da
                Ayahuasca por menores de 18 (dezoito) anos deve permanecer como objeto de
                deliberação dos pais ou responsáveis. Desta forma, menores de idade precisam estar
                acompanhados de um responsável legal e não poderão participar sem o acompanhante.
              </p>
            </div>

            <div className='form-group'>
              <div className='form-field form-button'>
                <button
                  type='button'
                  className='btn-salvar'
                  disabled={isSubmitting}
                  onClick={verificarCadastroExistente}
                >
                  {!isSubmitting && 'Validar'}
                  {isSubmitting && <img src={loading} alt='Carregando' />}
                </button>
              </div>
            </div>
          </div>
        </Form>
      )}

      {validado && !actionData?.cadastrado && (
        <Form method='post' className='form-perfil' id='form-cadastro'>
          <div className='form-group'>
            <div className='form-group-header'>
              <h2>Informações básicas</h2>
            </div>
            <div className='form-field'>
              <label htmlFor='nome'>Nome *</label>
              <input type='text' name='nome' id='nome' defaultValue={''} autoComplete='off' />
            </div>

            <div className='form-field'>
              <label htmlFor='nome_completo'>Sobrenome *</label>
              <input
                type='text'
                name='sobrenome'
                id='sobrenome'
                defaultValue={''}
                autoComplete='off'
              />
            </div>

            <div className='form-field'>
              <label htmlFor='data_nascimento'>Data de nascimento *</label>
              <input
                type='date'
                name='data_nascimento'
                id='data_nascimento'
                defaultValue={_dataNascimento}
                autoComplete='off'
                readOnly
                required
              />
            </div>
            <div className='form-field'>
              <label htmlFor='hora_nascimento'>Hora de nascimento</label>
              <input
                type='time'
                name='hora_nascimento'
                id='hora_nascimento'
                defaultValue={''}
                autoComplete='off'
              />
            </div>
            <div className='form-field'>
              <label htmlFor='estado_nascimento'>Estado de nascimento</label>
              <select
                name='estado_nascimento'
                id='estado_nascimento'
                onChange={carregarCidades}
                defaultValue={ufs[2]}
              >
                {ufs.map((uf) => (
                  <option key={uf.sigla} value={uf.sigla}>
                    {uf.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className='form-field'>
              <label htmlFor='cidade_nascimento'>Cidade de nascimento</label>
              <select name='cidade_nascimento' id='cidade_nascimento' defaultValue={''}>
                {arrayCidades.map((cidade) => (
                  <option key={cidade.id} value={cidade.nome}>
                    {cidade.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className='form-field'>
              <label htmlFor='estado_civil'>Estado civíl *</label>
              <select
                name='estado_civil'
                id='estado_civil'
                onChange={(e) => setEstadoCivil(e.target.value)}
                defaultValue={estadoCivil}
                required
              >
                <option value={EstadoCivil.SOLTEIRO}>Solteiro(a)</option>
                <option value={EstadoCivil.CASADO}>Casado(a)</option>
                <option value={EstadoCivil.VIUVO}>Viúvo(a)</option>
                <option value={EstadoCivil.DIVORCIADO}>Divorciado(a)</option>
              </select>
            </div>

            {estadoCivil == EstadoCivil.CASADO && (
              <div className='form-field form-field-full'>
                <label htmlFor='nome_conjuge'>Nome conjuge</label>
                <input
                  type='text'
                  name='nome_conjuge'
                  id='nome_conjuge'
                  defaultValue={''}
                  autoComplete='off'
                />
              </div>
            )}
          </div>

          <div className='form-group'>
            <div className='form-group-header'>
              <h2>Documentos</h2>
            </div>
            <div className='form-field'>
              <label htmlFor='rg'>RG *</label>
              <input
                type='number'
                name='rg'
                id='rg'
                defaultValue={''}
                autoComplete='off'
                required
              />
            </div>

            <div className='form-field'>
              <label htmlFor='cpf'>CPF *</label>
              <InputMask
                type='text'
                name='cpf'
                id='cpf'
                defaultValue={_cpf}
                autoComplete='off'
                required
                readOnly
                mask='999.999.999-99'
                maskChar={' '}
              />
            </div>
          </div>

          <div className='form-group'>
            <div className='form-group-header'>
              <h2>Informações de contato</h2>
            </div>
            <div className='form-field'>
              <label htmlFor='email'>E-mail *</label>
              <input
                type='email'
                name='email'
                id='email'
                className='input-email'
                defaultValue={_email}
                autoComplete='off'
                readOnly
              />
            </div>
            <div className='form-field'>
              <label htmlFor='celular'>Celular *</label>
              <InputMask
                type='text'
                name='celular'
                id='celular'
                defaultValue={''}
                autoComplete='off'
                required
                mask='\+55 \(99\) 9 9999-9999'
                maskChar={' '}
              />
            </div>
            <div className='form-field'>
              <label htmlFor='telefone_fixo'>Telefone fixo</label>
              <InputMask
                type='text'
                name='telefone_fixo'
                id='telefone_fixo'
                defaultValue={''}
                autoComplete='off'
                mask='\+55 \(\5\1\) 9999-9999'
                maskChar={' '}
              />
            </div>
            <div className='form-group-header'>
              <h2>Endereço</h2>
            </div>
            <div className='form-field'>
              <label htmlFor='cep'>CEP *</label>
              <InputMask
                type='text'
                name='cep'
                id='cep'
                defaultValue={''}
                autoComplete='off'
                required
                mask='99999\-999'
                maskChar={' '}
                onChange={carregarEndereco}
              />
            </div>
            <div className='form-field form-field-full'>
              <label htmlFor='endereco'>Endereço *</label>
              <input
                type='text'
                name='endereco'
                id='endereco'
                defaultValue={endereco.logradouro ?? ''}
                autoComplete='off'
                required
              />
            </div>
            <div className='form-field'>
              <label htmlFor='numero'>Número *</label>
              <input
                type='text'
                name='numero'
                id='numero'
                defaultValue={''}
                autoComplete='off'
                required
              />
            </div>
            <div className='form-field'>
              <label htmlFor='numero'>Complemento</label>
              <input
                type='text'
                name='complemento'
                id='complemento'
                defaultValue={''}
                autoComplete='off'
              />
            </div>
            <div className='form-field'>
              <label htmlFor='bairro'>Bairro *</label>
              <input
                type='text'
                name='bairro'
                id='bairro'
                defaultValue={endereco.bairro ?? ''}
                autoComplete='off'
                required
              />
            </div>
            <div className='form-field'>
              <label htmlFor='cidade'>Cidade *</label>
              <input
                type='text'
                name='cidade'
                id='cidade'
                defaultValue={endereco.cidade ?? ''}
                autoComplete='off'
                required
              />
            </div>
            <div className='form-field'>
              <label htmlFor='estado'>Estado *</label>
              <input
                type='text'
                name='estado'
                id='estado'
                defaultValue={endereco.estado ?? ''}
                autoComplete='off'
                required
              />
            </div>
          </div>

          <div className='form-group'>
            <div className='form-group-header'>
              <h2>Medicação</h2>
            </div>
            <div className='form-field-membro'>
              {/* usa medicação controlada? sim / não */}
              <h3>Usa medicação controlada?</h3>
              <div>
                <div className='form-field-membro-response'>
                  <input
                    type='radio'
                    name='medicacao_controlada'
                    id='medicacao_controlada-sim'
                    defaultChecked={medicacaoControlada === true}
                    value={'true'}
                    onChange={handleMedicacaoControlada}
                  />
                  <label htmlFor='medicacao_controlada-sim'>Sim</label>
                </div>
                <div className='form-field-membro-response'>
                  <input
                    type='radio'
                    name='medicacao_controlada'
                    id='medicacao_controlada-nao'
                    defaultChecked={medicacaoControlada === false}
                    value={'false'}
                    onChange={handleMedicacaoControlada}
                  />
                  <label htmlFor='medicacao_controlada-nao'>Não</label>
                </div>
              </div>
            </div>
            {/*
             * qual? resposta aberta
             * para tratar qual quadro de saúde? resposta aberta
             * tem autorização do médico para participar? sim /não
             * */}
            {medicacaoControlada && (
              <div className='form-field medicacao-controlada'>
                <label htmlFor='nome_medicacao'>Nome da medicação</label>
                <input
                  type='text'
                  name='nome_medicacao'
                  id='nome_medicacao'
                  defaultValue={''}
                  autoComplete='off'
                  required={medicacaoControlada}
                />

                <label htmlFor='quadro_saude'>Para tratar qual quadro de saúde?</label>
                <input
                  type='text'
                  name='quadro_saude'
                  id='quadro_saude'
                  defaultValue={''}
                  autoComplete='off'
                  required={medicacaoControlada}
                />

                <div className='form-field-membro'>
                  <h3>Tem autorização do médico para participar?</h3>
                  <div>
                    <div className='form-field-membro-response'>
                      <input
                        type='radio'
                        name='autorizacao_medico'
                        id='autorizacao_medico-sim'
                        defaultChecked={true}
                        value='true'
                      />
                      <label htmlFor='autorizacao_medico-sim'>Sim</label>
                    </div>
                    <div className='form-field-membro-response'>
                      <input
                        type='radio'
                        name='autorizacao_medico'
                        id='autorizacao_medico-nao'
                        defaultChecked={false}
                        value='false'
                      />
                      <label htmlFor='autorizacao_medico-nao'>Não</label>
                    </div>
                  </div>
                </div>
                <div className='form-field-full'>
                  <p className='aviso'>
                    Se você usa alguma medicação controlada é importante também entrar em contato
                    para realizar uma anamnese, envie um whatsapp para{' '}
                    <a
                      href='https://wa.me/5551993589591?text=Ol%C3%A1%2C+estou+me+cadastrando+no+CHAVE+e+gostaria+de+falar+sobre+minha+medica%C3%A7%C3%A3o.'
                      target='_blank'
                    >
                      (51) 99358-9591
                    </a>
                    . A medicação não vai lhe impedir de participar das sessões mas nós temos
                    orientações específicas para lhe passar. Por isso é muito importante entrar em
                    contato além de preencher o questionário. Não pule este passo pois o contato por
                    whatsapp neste caso é obrigatório para a participação.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className='form-group'>
            <div className='form-group-header'>
              <h2>Contato de referencia</h2>
            </div>
            <div className='form-field'>
              <label htmlFor='nome_referencia'>Nome da referencia *</label>
              <input
                type='text'
                name='nome_referencia'
                id='nome_referencia'
                defaultValue={''}
                autoComplete='off'
                required
              />
            </div>
            <div className='form-field'>
              <label htmlFor='email_referencia'>E-mail da referencia</label>
              <input
                type='email'
                name='email_referencia'
                id='email_referencia'
                className='input-email'
                defaultValue={''}
                autoComplete='off'
              />
            </div>
            <div className='form-field'>
              <label htmlFor='telefone_referencia'>Celular da referencia *</label>
              <InputMask
                type='text'
                name='telefone_referencia'
                id='telefone_referencia'
                defaultValue={''}
                autoComplete='off'
                required
                mask='\+55 \(99\) 9 9999-9999'
                maskChar={' '}
              />
            </div>
            <div className='form-field'>
              <label htmlFor='endereco_referencia'>Endereço da referencia</label>
              <input
                type='text'
                name='endereco_referencia'
                id='endereco_referencia'
                defaultValue={''}
                autoComplete='off'
              />
            </div>
            <div className='form-field'>
              <label htmlFor='parentesco_referencia'>Parentesco *</label>
              <input
                type='text'
                name='parentesco_referencia'
                id='parentesco_referencia'
                defaultValue={''}
                autoComplete='off'
                required
              />
            </div>
          </div>

          <div className='form-group'>
            <div className='form-group-header'>
              <h2>Social</h2>
            </div>
            <div className='form-field profissao'>
              <label htmlFor='profissao'>Profissão / Atividade</label>
              <input
                type='text'
                name='profissao'
                id='profissao'
                defaultValue={''}
                autoComplete='off'
              />
            </div>

            <div className='form-field'>
              <label htmlFor='escolaridade'>Escolaridade</label>
              <select name='escolaridade' id='escolaridade' defaultValue={Escolaridade.NAO_APLICA}>
                <option value={Escolaridade.NAO_APLICA}>Prefiro não informar</option>
                <option value={Escolaridade.FUNDAMENTAL_COMPLETO}>Fundamental completo </option>
                <option value={Escolaridade.FUNDAMENTAL_INCOMPLETO}>Fundamental incompleto </option>

                <option value={Escolaridade.MEDIO_COMPLETO}>Médio completo </option>
                <option value={Escolaridade.MEDIO_INCOMPLETO}>Médio incompleto </option>

                <option value={Escolaridade.SUPERIOR_COMPLETO}>Superior completo </option>
                <option value={Escolaridade.SUPERIOR_INCOMPLETO}>Superior incompleto </option>
              </select>
            </div>

            <div className='form-field'>
              <label htmlFor='grupo'>Grupo *</label>
              <select
                name='grupo'
                id='grupo'
                onChange={(e) => setGrupo(e.target.value)}
                defaultValue={Grupo.VISITANTE}
              >
                <option value={Grupo.VISITANTE}>Visitante </option>
                <option value={Grupo.FARDADO}>Fardado </option>
              </select>
            </div>

            {grupo === Grupo.FARDADO && (
              <div className='form-field-full'>
                <div className='form-field'>
                  <label htmlFor='data_fardamento'>Data de fardamento</label>
                  <input
                    type='date'
                    name='data_fardamento'
                    id='data_fardamento'
                    defaultValue={''}
                    autoComplete='off'
                  />
                </div>

                <div className='form-field profissao'>
                  <label htmlFor='profissao'>Local de fardamento</label>
                  <input
                    type='text'
                    name='local_fardamento'
                    id='local_fardamento'
                    defaultValue={''}
                    autoComplete='off'
                  />
                </div>
              </div>
            )}

            <div className='form-field-membro'>
              <h3>Você é membro?</h3>
              <div>
                <div className='form-field-membro-response'>
                  <input
                    type='radio'
                    name='membro'
                    id='membro_sim'
                    defaultChecked={false}
                    value={'true'}
                  />
                  <label htmlFor='membro_sim'>Sim</label>
                </div>
                <div className='form-field-membro-response'>
                  <input
                    type='radio'
                    name='membro'
                    id='membro_nao'
                    defaultChecked={true}
                    value={'false'}
                  />
                  <label htmlFor='membro_nao'>Não?</label>
                </div>
              </div>
            </div>

            <div className='form-field-membro'>
              <h3>Primeira vez tomando o chá?</h3>
              <div>
                <div className='form-field-membro-response'>
                  <input
                    type='radio'
                    name='primeira_vez'
                    id='primeira_vez-sim'
                    defaultChecked={true}
                    value={'true'}
                  />
                  <label htmlFor='primeira_vez-sim'>Sim</label>
                </div>
                <div className='form-field-membro-response'>
                  <input
                    type='radio'
                    name='primeira_vez'
                    id='primeira_vez-nao'
                    defaultChecked={false}
                    value={'false'}
                  />
                  <label htmlFor='primeira_vez-nao'>Não?</label>
                </div>
              </div>
            </div>
          </div>
          <div className='form-group'>
            <div className='form-group-header'>
              <h2>Bio</h2>
            </div>
            <div className='form-field-bio'>
              <label htmlFor='bio'>Escreva um pouco sobre você</label>
              <textarea name='bio' id='bio' defaultValue={''}></textarea>
            </div>
          </div>
          <div className='form-group'>
            <div className='form-field form-button'>
              <button type='submit' className='btn-salvar' disabled={isSubmitting}>
                {!isSubmitting && 'Salvar'}
                {isSubmitting && <img src={loading} alt='Carregando' />}
              </button>
            </div>
          </div>
        </Form>
      )}

      {validado && actionData?.cadastrado && true && (
        <div className='form-perfil' id='cadastrado'>
          <img src={successfullyRegistered} alt='Cadastro realizado' width='380' />
          <p style={{ textAlign: 'center' }}>
            <strong>Oba!</strong> Deu tudo certo com seu cadastro. <br />
            <strong>Você já pode fechar esta janela.</strong>
          </p>
        </div>
      )}
      <div className='footer'></div>
    </main>
  );
}
