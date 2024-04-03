import { mailClient } from '~/mailer.server';

const APP_URL = process.env.APP_URL

export default async function enviarEmailEsqueciSenha(
  email: string,
  token: string
): Promise<Boolean | null | undefined> {
  var options = {
    from: 'igrejachavedesaopedro@gmail.com',
    to: email,
    subject: 'Esqueci minha senha - ChaveCloud',
    html: `Olá, ${email} <br /><br />
    Você solicitou um link para resetar a sua senha. <br />
    
    <a href="${APP_URL}/autentica/senha/${token}">Clique aqui</a> para setar uma nova senha para sua conta.
    <br />
    Caso você não consiga clicar no link, copie e cole no seu navegador.`,
  };

  try {
    //@ts-ignore
    mailClient.sendMail(options, function(error, info){
      if (error) {
        console.log(error);
        return false;
      } else {
        console.log(`${new Date().toLocaleString()}:: CONTEXTO: senha | E-MAIL: ${email} | SMTP: ${info.response}`);
        return true;
      }
    }); 
  } catch (error) {
    return null;
  }
}
