import { mailClient } from '~/mailer.server';

const APP_URL = process.env.APP_URL;

export default async function enviarEmailEsqueciSenha(
  email: string,
  token: string
): Promise<boolean> {
  const resetUrl = `${APP_URL}/autentica/senha/${token}`;
  
  const options = {
    from: 'Bendita Canábica <contato@benditacanabica.com.br>',
    to: email,
    subject: 'Recuperação de Senha - Associação Bendita Canábica',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Roboto', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #6b00b3 0%, #9932cc 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .info-box {
              background: white;
              border-left: 4px solid #9932cc;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .info-box h3 {
              margin-top: 0;
              color: #6b00b3;
            }
            .button {
              display: inline-block;
              background: #9932cc;
              color: white;
              padding: 15px 40px;
              text-decoration: none;
              border-radius: 25px;
              margin: 20px 0;
              font-weight: bold;
              font-size: 16px;
            }
            .button:hover {
              background: #6b00b3;
            }
            .link-box {
              background: #f0e5f7;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
              word-break: break-all;
            }
            .link-box code {
              color: #6b00b3;
              font-size: 12px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 14px;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .security-note {
              background: #e7f3ff;
              border-left: 4px solid #2196f3;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔐 Recuperação de Senha</h1>
          </div>
          
          <div class="content">
            <p>Olá,</p>
            
            <p>Recebemos uma solicitação para redefinir a senha da sua conta na <strong>Associação Bendita Canábica</strong>.</p>
            
            <div class="info-box">
              <h3>✨ Como proceder</h3>
              <p>Clique no botão abaixo para criar uma nova senha para sua conta:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">
                  Redefinir Minha Senha
                </a>
              </div>
            </div>
            
            <div class="warning">
              <strong>⏰ Link temporário:</strong> Este link é válido por tempo limitado. Se expirar, você precisará solicitar uma nova recuperação de senha.
            </div>
            
            <p><strong>Não consegue clicar no botão?</strong><br>
            Copie e cole o link abaixo no seu navegador:</p>
            
            <div class="link-box">
              <code>${resetUrl}</code>
            </div>
            
            <div class="security-note">
              <strong>🛡️ Não solicitou esta alteração?</strong><br>
              Se você não pediu para redefinir sua senha, ignore este e-mail. Sua senha permanecerá inalterada e sua conta está segura.
            </div>
            
            <p>Se você tiver qualquer dúvida ou precisar de ajuda, não hesite em entrar em contato conosco.</p>
            
            <p>Atenciosamente,<br>
            <strong>Equipe Bendita Canábica</strong></p>
          </div>
          
          <div class="footer">
            <p>Este é um e-mail automático, por favor não responda.</p>
            <p>© ${new Date().getFullYear()} Associação Bendita Canábica. Todos os direitos reservados.</p>
          </div>
        </body>
      </html>
    `,
  };

  try {
    //@ts-ignore
    return new Promise((resolve, reject) => {
      mailClient.sendMail(options, function(error, info) {
        if (error) {
          console.error(`[${new Date().toISOString()}] Erro ao enviar e-mail de recuperação de senha para ${email}:`, error);
          resolve(false);
        } else {
          console.log(`[${new Date().toISOString()}] E-mail de recuperação de senha enviado para ${email} | SMTP: ${info.response}`);
          resolve(true);
        }
      });
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Exceção ao enviar e-mail de recuperação de senha:`, error);
    return false;
  }
}
