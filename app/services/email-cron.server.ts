import cron from 'node-cron';
import { checkNewEmails } from './imap.server';

let cronJob: cron.ScheduledTask | null = null;

function isImapEnabled(): boolean {
  if (process.env.DISABLE_IMAP === 'true') return false;
  // No ambiente local, nao precisamos mapear IMAP nem rodar cron
  if (process.env.NODE_ENV === 'local') return false;
  return true;
}

export function startEmailCron(): void {
  if (!isImapEnabled()) {
    return;
  }

  if (!process.env.IMAP_USER || !process.env.IMAP_PASSWORD) {
    console.log('[CRON] ℹ️  IMAP nao configurado (IMAP_USER/IMAP_PASSWORD ausentes). Cron nao iniciado.');
    return;
  }

  if (cronJob) {
    console.log('[CRON] ⚠️  Cron de emails já está rodando');
    return;
  }

  // Rodar a cada 5 minutos: "*/5 * * * *"
  // Rodar a cada 1 minuto: "* * * * *"
  // Rodar a cada 15 minutos: "*/15 * * * *"
  const cronExpression = process.env.CRON_EMAIL_SCHEDULE || '*/5 * * * *';

  cronJob = cron.schedule(cronExpression, async () => {
    try {
      console.log(`\n[CRON] 🕐 Verificação de emails agendada para ${new Date().toLocaleString('pt-BR')}`);
      await checkNewEmails();
    } catch (error) {
      console.error('[CRON] ❌ Erro ao verificar emails:', error);
    }
  });

  console.log(`[CRON] ✅ Cron de emails iniciado`);
  console.log(`[CRON] ⏱️  Schedule: "${cronExpression}" (${getScheduleDescription(cronExpression)})`);
  console.log('[CRON] 📝 Use "/app/imap" para monitorar sincronizações\n');
}

export function stopEmailCron(): void {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('[CRON] ⏹️  Cron de emails parado');
  }
}

function getScheduleDescription(expr: string): string {
  const parts = expr.split(' ');
  if (expr === '*/5 * * * *') return 'a cada 5 minutos';
  if (expr === '*/1 * * * *' || expr === '* * * * *') return 'a cada 1 minuto';
  if (expr === '*/15 * * * *') return 'a cada 15 minutos';
  if (expr === '0 * * * *') return 'a cada hora';
  if (expr === '0 0 * * *') return 'diariamente à meia-noite';
  return 'conforme agendado';
}
