import { mailClient } from '~/mailer.server';
import { logEmailSentOnDb } from '../Logger/log-email-sent-on-db';

const APP_URL = process.env.APP_URL;

export default async function enviarEmailCadastroPerfil(
  email: string,
  nome: string
): Promise<Boolean | null | undefined> {
  var options = {
    from: 'igrejachavedesaopedro@gmail.com',
    to: email,
    subject: 'Seja Bem-vindo (a) ao CHAVE de São Pedro',
    html: `Olá, ${nome}! <br/><br/>

    Agora você está cadastrado para visitar o Chave de São Pedro e participar de um trabalho espiritual com o Santo Daime. <br/><br/>

    Se você usa alguma medicação controlada é importante também entrar em contato por algum dos nossos canais de atendimento para realizar uma anamnese <a href='https://wa.me/5551993589591?text=Ol%C3%A1.' target='_blank'>(51) 99358-9591</a>. <br/>
    A medicação não vai lhe impedir de participar das sessões mas nós temos orientações específicas para lhe passar. Por isso é importante entrar em contato além de preencher o questionário. <br/><br/>

    OS PRÓXIMOS PASSOS SÃO IMPORTANTES! PRESTE ATENÇÃO <br /><br/>

    <ul>
      <li>Ler as instruções gerais que estão neste link: <a href="https://www.chave.org.br/orientacoes-gerais/" target="_blank">Orientações Gerais – CHAVE de São Pedro</a>;</li>
      <li>Verificar no calendário que está <a href="https://www.chave.org.br/calendario/" target="_blank">neste link</a> a data e horário do trabalho que você gostaria de participar. <br/>
        Recomendamos para primeira vez os trabalhos de Concentração, Mesa Branca ou São Miguel. Estes são trabalhos com duração média de 4h. <br/>
        Não recomendamos a saída antes do encerramento da sessão. Se você escolheu conhecer este trabalho, pedimos que aceite o compromisso de ficar até o final;
      </li>
      <li>Chegue com 30 minutos de antecedência para participar de uma reunião de instruções. É muito importante que você participe deste momento. Não se atrase!</li>
      <li>As vestimentas adequadas são roupas claras. Para mulheres saia longa abaixo do joelho, blusa com manga e sem decotes. Recomendamos usar calças por baixo pelos mosquitos. <br>
      Para os homens, calças e camisa com manga. Levar agasalhos mesmo que estejamos em um dia quente. A igreja é num sítio e faz frio a noite;</li>
      <li>Somos uma casa de caridade e não cobramos para participação nos trabalhos. No entanto, aceitamos doações e qualquer valor ajuda muito; <br/>
      Se puder e desejar, você pode contribuir por PIX na conta da Igreja Chave de São Pedro através do CNPJ 04437655000182. Pode entregar na secretaria da igreja também;</li>
      <li>Qualquer dúvida que você tenha é só enviar por mensagem: <a href='https://wa.me/5551993589591?text=Ol%C3%A1.' target='_blank'>(51) 99358-9591</a>.</li>
    </ul>
    <br/><br/>
    
    Estamos à disposição.<br/>
    Até logo!
    <br/><br/>`,
  };

  try {
    //@ts-ignore
    mailClient.sendMail(options, function (error, info) {
      if (error) {
        console.log(error);
        return false;
      } else {
        console.log(
          `${new Date().toLocaleString()}:: CONTEXTO: bem-vindo | E-MAIL: ${email} | SMTP: ${
            info.response
          }`
        );

        logEmailSentOnDb({ destinatario: email, contexto: 'bem-vindo'})

        return true;
      }
    });
  } catch (error) {
    return null;
  }
}
