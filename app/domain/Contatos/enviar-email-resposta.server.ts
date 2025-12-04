import { mailClient } from '~/mailer.server';

export default async function enviarEmailResposta(
  email: string,
  nomeDestinatario: string,
  resposta: string
): Promise<boolean> {
  const options = {
    from: 'Bendita Canábica <contato@benditacanabica.com.br>',
    to: email,
    subject: 'Você recebeu uma mensagem da Associação Bendita Canábica',
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
            .message-box {
              background: white;
              border-left: 4px solid #9932cc;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .message-box h3 {
              margin-top: 0;
              color: #6b00b3;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>💬 Você Recebeu uma Mensagem</h1>
          </div>
          
          <div class="content">
            <p>Olá, <strong>${nomeDestinatario}</strong>!</p>
            
            <p>A equipe da <strong>Associação Bendita Canábica</strong> respondeu sua mensagem. Confira abaixo:</p>
            
            <div class="message-box">
              <h3>📬 Mensagem do Atendimento</h3>
              <p style="white-space: pre-wrap; margin: 0;">${resposta}</p>
            </div>
            
            <p>Se você tiver mais dúvidas ou precisar de ajuda adicional, não hesite em contatar-nos novamente através do formulário de contato.</p>
            
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
          console.error(`[${new Date().toISOString()}] Erro ao enviar e-mail de resposta para ${email}:`, error);
          resolve(false);
        } else {
          console.log(`[${new Date().toISOString()}] E-mail de resposta enviado para ${email} | SMTP: ${info.response}`);
          resolve(true);
        }
      });
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Exceção ao enviar e-mail de resposta:`, error);
    return false;
  }
}
