import { prisma } from '~/secure/db.server';
import { deletarVariosArquivosS3 } from '~/storage/s3-delete.server';

export default async function deletarPerfilCompleto(perfilId: string): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Buscar perfil com todas as relações
    const perfil = await prisma.perfil.findUnique({
      where: { id: perfilId },
      include: {
        usuario: true,
        Associacao: {
          include: {
            Documentos: true,
            Pagamentos: true,
            Interesses: true,
          },
        },
        Documentos: true, // Documentos criados por este perfil
        Dependentes: {
          // Associados que têm este perfil como responsável
          include: {
            Documentos: true,
            Pagamentos: true,
            Interesses: true,
          },
        },
      },
    });

    if (!perfil) {
      return { success: false, message: 'Perfil não encontrado.' };
    }

    // 2. Coletar URLs dos arquivos S3 para deletar
    const arquivosS3: string[] = [];
    
    // Documentos do próprio associado
    if (perfil.Associacao?.Documentos) {
      perfil.Associacao.Documentos.forEach((doc) => {
        if (doc.nome_arquivo) {
          arquivosS3.push(doc.nome_arquivo);
        }
      });
    }

    // Documentos dos dependentes (se este perfil for responsável)
    if (perfil.Dependentes) {
      perfil.Dependentes.forEach((dependente) => {
        dependente.Documentos.forEach((doc) => {
          if (doc.nome_arquivo) {
            arquivosS3.push(doc.nome_arquivo);
          }
        });
      });
    }

    // Documentos criados por este perfil (mas que pertencem a outros associados)
    if (perfil.Documentos) {
      perfil.Documentos.forEach((doc) => {
        if (doc.nome_arquivo && !arquivosS3.includes(doc.nome_arquivo)) {
          arquivosS3.push(doc.nome_arquivo);
        }
      });
    }

    console.log(`[${new Date().toISOString()}] Iniciando deleção do perfil: ${perfil.nome_completo} (${perfilId})`);
    console.log(`[${new Date().toISOString()}] Total de arquivos S3 a deletar: ${arquivosS3.length}`);

    // 3. Deletar arquivos do S3
    if (arquivosS3.length > 0) {
      const resultadoS3 = await deletarVariosArquivosS3(arquivosS3);
      console.log(`[${new Date().toISOString()}] Arquivos S3 deletados: ${resultadoS3.success}/${arquivosS3.length}`);
    }

    // 4. Deletar em ordem (respeitar constraints de FK)
    
    // 4.1. Deletar dependentes (se este perfil for responsável)
    if (perfil.Dependentes && perfil.Dependentes.length > 0) {
      for (const dependente of perfil.Dependentes) {
        // Deletar interesses do dependente
        await prisma.interesse.deleteMany({
          where: { associadoId: dependente.id },
        });
        console.log(`[${new Date().toISOString()}] Interesses deletados para dependente: ${dependente.id}`);

        // Deletar pagamentos do dependente
        await prisma.pagamento.deleteMany({
          where: { associadoId: dependente.id },
        });
        console.log(`[${new Date().toISOString()}] Pagamentos deletados para dependente: ${dependente.id}`);

        // Deletar documentos do dependente
        await prisma.documentos.deleteMany({
          where: { associadoId: dependente.id },
        });
        console.log(`[${new Date().toISOString()}] Documentos deletados para dependente: ${dependente.id}`);

        // Deletar associação do dependente
        await prisma.associado.delete({
          where: { id: dependente.id },
        });
        console.log(`[${new Date().toISOString()}] Associação deletada para dependente: ${dependente.id}`);

        // Deletar perfil do dependente
        await prisma.perfil.delete({
          where: { id: dependente.perfilId },
        });
        console.log(`[${new Date().toISOString()}] Perfil deletado para dependente: ${dependente.perfilId}`);

        // Buscar e deletar usuário do dependente
        const usuarioDependente = await prisma.usuario.findFirst({
          where: { perfil: { id: dependente.perfilId } },
        });
        if (usuarioDependente) {
          await prisma.usuario.delete({
            where: { id: usuarioDependente.id },
          });
          console.log(`[${new Date().toISOString()}] Usuário deletado para dependente: ${usuarioDependente.id}`);
        }
      }
    }

    // 4.2. Deletar registros do próprio associado (se existir)
    if (perfil.Associacao) {
      // Deletar interesses
      await prisma.interesse.deleteMany({
        where: { associadoId: perfil.Associacao.id },
      });
      console.log(`[${new Date().toISOString()}] Interesses deletados para associado: ${perfil.Associacao.id}`);

      // Deletar pagamentos
      await prisma.pagamento.deleteMany({
        where: { associadoId: perfil.Associacao.id },
      });
      console.log(`[${new Date().toISOString()}] Pagamentos deletados para associado: ${perfil.Associacao.id}`);

      // Deletar documentos
      await prisma.documentos.deleteMany({
        where: { associadoId: perfil.Associacao.id },
      });
      console.log(`[${new Date().toISOString()}] Documentos deletados para associado: ${perfil.Associacao.id}`);

      // Deletar associação
      await prisma.associado.delete({
        where: { id: perfil.Associacao.id },
      });
      console.log(`[${new Date().toISOString()}] Associação deletada: ${perfil.Associacao.id}`);
    }

    // 4.3. Atualizar documentos criados por este perfil (remover referência)
    await prisma.documentos.updateMany({
      where: { criadoPorId: perfilId },
      data: { criadoPorId: null },
    });
    console.log(`[${new Date().toISOString()}] Referências de documentos criados atualizadas`);

    // 4.4. Deletar tokens de recuperação de senha
    await prisma.usuario_Esqueci_Senha.deleteMany({
      where: { usuarioId: perfil.usuarioId },
    });
    console.log(`[${new Date().toISOString()}] Tokens de recuperação de senha deletados`);

    // 4.5. Deletar perfil
    await prisma.perfil.delete({
      where: { id: perfilId },
    });
    console.log(`[${new Date().toISOString()}] Perfil deletado: ${perfilId}`);

    // 4.6. Deletar usuário
    await prisma.usuario.delete({
      where: { id: perfil.usuarioId },
    });
    console.log(`[${new Date().toISOString()}] Usuário deletado: ${perfil.usuarioId}`);

    const totalDependentes = perfil.Dependentes?.length || 0;
    const mensagemDependentes = totalDependentes > 0 
      ? ` e ${totalDependentes} dependente(s)` 
      : '';

    return { 
      success: true, 
      message: `Perfil de ${perfil.nome_completo}${mensagemDependentes} foi deletado com sucesso, incluindo ${arquivosS3.length} arquivo(s).` 
    };

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erro ao deletar perfil completo:`, error);
    return { 
      success: false, 
      message: `Erro ao deletar perfil: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
    };
  }
}
