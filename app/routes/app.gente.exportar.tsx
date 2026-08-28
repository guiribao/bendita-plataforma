//@ts-nocheck
import type { LoaderFunctionArgs } from '@remix-run/node';
import { requireRoles } from '~/secure/require-role.server';
import { Papel } from '@prisma/client';
import { gerarPDFPessoas } from '~/domain/Exportacao/exportar-pessoas-pdf.server';

export async function loader({ request }: LoaderFunctionArgs) {
  // Verifica autenticação
  await requireRoles(request, [Papel.ADMIN, Papel.SECRETARIA]);

  try {
    // Gera o PDF
    const pdfBuffer = await gerarPDFPessoas();

    // Define o nome do arquivo com data/hora
    const dataHora = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, -5);
    const nomeArquivo = `relatorio-pessoas-${dataHora}.pdf`;

    // Retorna o PDF como resposta
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (erro: any) {
    console.error('Erro ao gerar PDF:', erro);
    return new Response('Erro ao gerar PDF: ' + erro.message, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
