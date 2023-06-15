import { prisma } from '~/secure/db.server';
import { mailClient } from '~/mailer.server';
import { Usuario } from '@prisma/client';
import Constraints from '~/shared/Constraints';

export default async function enviarEmailEsqueciSenha(
  email: string,
  token: string
): Promise<Boolean | null | undefined> {
  var options = {
    from: 'cloud@chave.org.br',
    to: email,
    subject: 'Esqueci minha senha - ChaveCloud',
    text: `Olá, ${email} \n
    \n
    Você solicitou um link para resetar a sua senha, segue logo abaixo: \n
    
    <a href="${Constraints.APP_URL}/autentica/senha/${token}">${Constraints.APP_URL}/autentica/senha/${token}</a> \n
    \n
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
