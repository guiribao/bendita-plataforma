import {
  ActionFunction,
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
  json,
} from "@remix-run/node";
import { Form, Link, useActionData, useNavigate, useNavigation } from "@remix-run/react";

import { authenticator } from "~/secure/authentication.server";

import criarNovoUsuario from "~/domain/Usuario/criar-novo-usuario.server";

import cadastroStyle from "~/assets/css/cadastro.css";

import InputMask from "react-input-mask";
import criarPerfil from "~/domain/Perfil/criar-perfil.server";
import criarAssociado from "~/domain/Associado/criar-associado.server";
import { useEffect, useState } from "react";
import { brStringToIsoString, verificarIdade } from "~/shared/DateTime.util";
import pegarUsuarioPeloEmail from "~/domain/Usuario/pegar-usuario-pelo-email.server";
import perfilPorCpf from "~/domain/Perfil/perfil-por-cpf.server";

import loading from "~/assets/img/loading.gif"
import { Papel } from "@prisma/client";
import paises from "~/assets/paises.json"

export const meta: MetaFunction = () => {
  return [
    { title: "Informações básicas - Bendita Associação Canábica" },
    { name: "description", content: "Solicitação de análise associativa da Bendita Associação Canábica" },
  ];
};

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: cadastroStyle }];
};

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();

  const email = form.get("email");
  const senha = form.get("senha");
  const senhaRepetida = form.get("senha_repetida");
  const nomeCompleto = form.get("nome_completo");
  const apelido = form.get("apelido");
  const cpf = form.get("cpf");
  const rg = form.get("rg");
  const nacionalidade = form.get("nacionalidade");
  const estadoCivil = form.get("estado_civil");
  const sexo = form.get("sexo");
  const telefone = form.get("telefone");
  const cep = form.get("cep");
  const enderecoRua = form.get("endereco_rua");
  const enderecoNumero = form.get("endereco_numero");
  const bairro = form.get("bairro");
  const cidade = form.get("cidade");
  const estado = form.get("estado");
  const enderecoComplemento = form.get("endereco_complemento");

  let dataNascimento = form.get("data_nascimento");

  let errors = {
    email: !email,
    senha: !senha,
    nomeCompleto: !nomeCompleto,
    apelido: !apelido,
    cpf: !cpf,
    nacionalidade: !nacionalidade,
    estado_civil: !estadoCivil,
    telefone: !telefone,
    cep: !cep,
    endereco_rua: !enderecoRua,
    endereco_numero: !enderecoNumero,
    bairro: !bairro,
    cidade: !cidade,
    estado: !estado
  };

  if (Object.values(errors).some(Boolean)) {
    const values = Object.fromEntries(form);
    return json({ errors, values });
  }

  if (senha != senhaRepetida) {
    errors = Object.assign(errors, { data: "Hmmm! Parece que a verificação de senha não confere" });
    return json({ errors });
  }

  if (senha.length < 8) {
    errors = Object.assign(errors, { data: "Sua senha deve ter no minimo 8 caracteres" });
    return json({ errors });
  }

  let usuarioSeExistir = await pegarUsuarioPeloEmail(email);
  let perfilSeExistir = await perfilPorCpf(cpf);

  if (email == usuarioSeExistir?.email) {
    return json({
      errors: {
        data: "Já existe uma conta associada a este e-mail, solicite recuperação de senha.",
      },
    });
  }

  if (cpf == perfilSeExistir?.cpf) {
    return json({
      errors: {
        data: "Já existe uma conta associada a este CPF, solicite recuperação de senha.",
      },
    });
  }

  dataNascimento = brStringToIsoString(dataNascimento)

  let necessarioResponsavel = verificarIdade(dataNascimento) < 18
  let papel: Papel = Papel.ASSOCIADO

  if (necessarioResponsavel) {
    papel = Papel.ASSOCIADO_DEPENDENTE
  }

  const usuario = await criarNovoUsuario(email, senha, papel)
  
  const perfil = await criarPerfil({
    nomeCompleto, apelido, dataNascimento, cpf, rg, nacionalidade, estadoCivil,
    sexo, telefone, cep, enderecoRua, enderecoNumero, bairro, cidade, estado,
    enderecoComplemento, usuarioId: usuario?.id
  })

  const associado = await criarAssociado(perfil?.id)

  const basico = {
    perfilId: perfil?.id,
    associadoId: associado?.id,
    necessarioResponsavel
  }

  return { basico }
};

export async function loader({ request }: LoaderFunctionArgs) {
  // If the user is already authenticated redirect to /dashboard directly
  return await authenticator.isAuthenticated(request, {
    successRedirect: "/dashboard",
  });
}

export default function CadastroBasico() {
  const navigation = useNavigation();
  const navigate = useNavigate();
  const actionData = useActionData();

  const [endereco, setEndereco] = useState({})

  const isSubmitting = ["submitting", "loading"].includes(navigation.state);

  useEffect(() => {
    //localStorage.removeItem("basico")
  }, [])

  useEffect(() => {
    if (actionData?.basico) {
      localStorage.setItem("basico", JSON.stringify(actionData.basico))
      navigate("/cadastro/documentos")
    }
  }, [actionData])

  async function carregarEndereco(event) {
    let cep = event.target.value.replace(/\D/g, "");

    if (cep.length < 8) return;

    let { logradouro, bairro, localidade, uf } = await fetch(
      "https://viacep.com.br/ws/" + encodeURIComponent(cep) + "/json/ "
    ).then(async (response) => await response.json());

    setEndereco({
      logradouro,
      bairro,
      cidade: localidade,
      estado: uf,
    });

    if (!logradouro) {
      let endereco = document.getElementById("endereco");
      endereco?.focus();
      return;
    }

    let numero = document.getElementById("numero");
    numero.value = "";
    numero?.focus();
  }

  return <Form method="post" className="step-group" name="basico">
    {actionData?.errors?.data && <p className="mensagem-erro">{actionData?.errors?.data}</p>}
    {actionData?.errors?.email && (
      <p className="mensagem-erro">Por favor, preencha o campo e-mail</p>
    )}

    {actionData?.errors?.senha && (
      <p className="mensagem-erro">Por favor, preencha o campo senha </p>
    )}
    <div className="disclaimer-usuario">
      <div className="form-group">
        <label htmlFor="email">Seu melhor e-mail *</label>
        <input type="email" name="email" id="email" autoComplete="off" required />
      </div>

      <div className="form-group inline-group">
        <div>
          <label htmlFor="senha">Senha *</label>
          <input type="password" name="senha" id="senha" autoComplete="off" required />
        </div>
        <div>
          <label htmlFor="senha_repetida">Repita a senha *</label>
          <input type="password" name="senha_repetida" id="senha_repetida" autoComplete="off" required />
        </div>
      </div>
      <p>Criaremos um usuário para você acessar o painel de associado.
        <br />Não compartilhe sua senha.</p>
    </div>


    <div className="form-group">
      <label htmlFor="nome_completo">Nome completo *</label>
      <input type="text" name="nome_completo" id="nome_completo" autoComplete="off" required />
    </div>

    <div className="form-group inline-group">
      <div>
        <label htmlFor="apelido">Como você deseja ser chamado? *</label>
        <input type="text" name="apelido" id="apelido" autoComplete="off" required />
      </div>
      <div>
        <label htmlFor="data_nascimento">Data de nascimento</label>
        <InputMask
          type="text"
          name="data_nascimento"
          id="data_nascimento"
          autoComplete="off"
          mask="99/99/9999"
          maskChar={"_"}
          placeholder="DD/MM/AAAA"
        />
      </div>
    </div>
    <div className="form-group inline-group">
      <div>
        <label htmlFor="cpf">Seu CPF *</label>
        <InputMask
          type="text"
          name="cpf"
          id="cpf"
          autoComplete="off"
          mask="999.999.999-99"
          maskChar={"_"}
          required
        />
      </div>
      <div>
        <label htmlFor="rg">RG</label>
        <input
          type="number"
          name="rg"
          id="rg"
          autoComplete="off"
        />
      </div>
    </div>
    <div className="form-group inline-group">
      <div>
        <label htmlFor="nacionalidade">Nacionalidade *</label>
        <select name="nacionalidade" id="nacionalidade" required>
          {paises.map(pais => <option key={pais.sigla} value={pais.gentilico}>{pais.nome_pais} - {pais.gentilico}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="estado_civil">Estado civil *</label>
        <select name="estado_civil" id="estado_civil" required>
          <option value="Solteiro (a)">Solteiro (a)</option>
          <option value="Casado (a)">Casado (a)</option>
          <option value="Divorciado (a)">Divorciado (a)</option>
          <option value="Viúvo (a)">Viúvo (a)</option>
        </select>
      </div>
    </div>
    <div className="form-group inline-group">
      <div>
        <label htmlFor="sexo">Sexo</label>
        <select name="sexo" id="sexo">
          <option value="Feminino">Feminino</option>
          <option value="Masculino">Masculino</option>
          <option value="Não binário">Não binário</option>
        </select>
      </div>
      <div>
        <label htmlFor="celular">Telefone / Whatsapp *</label>
        <InputMask
          type="text"
          name="telefone"
          id="telefone"
          autoComplete="off"
          mask="\+55 \(99\) 9 9999-9999"
          maskChar={"_"}
          required
        />
      </div>
    </div>
    <div className="form-group inline-group">
      <div>
        <label htmlFor="cep">CEP *</label>
        <InputMask
          type="text"
          name="cep"
          id="cep"
          autoComplete="off"
          mask="99999-999"
          maskChar={"_"}
          onChange={carregarEndereco}
          required
        />
      </div>
      <div>
        <label htmlFor="endereco_rua">Endereço *</label>
        <input type="text" name="endereco_rua" id="endereco_rua" autoComplete="off" required defaultValue={endereco?.logradouro ?? ""} />
      </div>
    </div>

    <div className="form-group inline-group">
      <div>
        <label htmlFor="endereco_numero">Número *</label>
        <input type="text" name="endereco_numero" id="endereco_numero" autoComplete="off" required defaultValue={""} />
      </div>
      <div>
        <label htmlFor="bairro">Bairro *</label>
        <input type="text" name="bairro" id="bairro" autoComplete="off" required defaultValue={endereco.bairro ?? ""} />
      </div>
    </div>

    <div className="form-group inline-group">
      <div>
        <label htmlFor="cidade">Cidade *</label>
        <input type="text" name="cidade" id="cidade" autoComplete="off" required defaultValue={endereco.cidade ?? ""} />
      </div>
      <div>
        <label htmlFor="estado">Estado *</label>
        <input type="text" name="estado" id="estado" autoComplete="off" required defaultValue={endereco.estado ?? ""} />
      </div>
    </div>

    <div className="form-group">

      <label htmlFor="endereco_complemento">Complemento</label>
      <input type="text" name="endereco_complemento" id="endereco_complemento" autoComplete="off" required defaultValue={""} />

    </div>

    <div className="submit-button">
      {isSubmitting
        ? <img src={loading} alt="Salvando dados" className="loading" />
        : <button type="submit">Avançar</button>}
    </div>
  </Form>
}
