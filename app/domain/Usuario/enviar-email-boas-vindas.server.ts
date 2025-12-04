import { mailClient } from '~/mailer.server';

const APP_URL = process.env.APP_URL;

export default async function enviarEmailBoasVindas(
  email: string,
  nomeCompleto: string,
  senhaTemporaria: string
): Promise<boolean> {
  const options = {
    from: 'Bendita Canábica <contato@benditacanabica.com.br>',
    to: email,
    subject: 'Boas-vindas à Associação Bendita Canábica',
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
            .credentials-box {
              background: white;
              border-left: 4px solid #9932cc;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .credentials-box h3 {
              margin-top: 0;
              color: #6b00b3;
            }
            .credential-item {
              margin: 10px 0;
              padding: 10px;
              background: #f0e5f7;
              border-radius: 5px;
            }
            .credential-item strong {
              color: #6b00b3;
            }
            .credential-item code {
              background: white;
              padding: 5px 10px;
              border-radius: 3px;
              font-family: 'Courier New', monospace;
              color: #333;
              display: inline-block;
              margin-left: 10px;
            }
            .button {
              display: inline-block;
              background: #9932cc;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 25px;
              margin: 20px 0;
              font-weight: bold;
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
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌿 Bem-vindo(a)!</h1>
          </div>
          
          <div class="content">
            <p>Olá, <strong>${nomeCompleto}</strong>!</p>
            
            <p>É com grande alegria que damos as boas-vindas à <strong>Associação Bendita Canábica</strong>! 🎉</p>
            
            <p>Sua conta foi criada com sucesso por nossa equipe administrativa. Abaixo estão suas credenciais de acesso à plataforma:</p>
            
            <div class="credentials-box">
              <h3>🔐 Credenciais de Acesso</h3>
              <div class="credential-item">
                <strong>E-mail:</strong>
                <code>${email}</code>
              </div>
              <div class="credential-item">
                <strong>Senha temporária:</strong>
                <code>${senhaTemporaria}</code>
              </div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong> Por motivos de segurança, recomendamos fortemente que você altere sua senha no primeiro acesso à plataforma.
            </div>
            
            <div style="text-align: center;">
              <a href="${APP_URL}/autentica/entrar" class="button">
                Acessar a Plataforma
              </a>
            </div>
            
            <p>Se você tiver qualquer dúvida ou precisar de ajuda, não hesite em entrar em contato conosco.</p>
            
            <p>Estamos muito felizes em tê-lo(a) conosco!</p>
            
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
          console.error(`[${new Date().toISOString()}] Erro ao enviar e-mail de boas-vindas para ${email}:`, error);
          resolve(false);
        } else {
          console.log(`[${new Date().toISOString()}] E-mail de boas-vindas enviado para ${email} | SMTP: ${info.response}`);
          resolve(true);
        }
      });
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Exceção ao enviar e-mail de boas-vindas:`, error);
    return false;
  }
}
