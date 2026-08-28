import { deleteStorageFile } from './local-storage.server';

export async function deletarArquivoLocal(key: string): Promise<boolean> {
  try {
    const deleted = await deleteStorageFile(key);
    if (deleted) {
      console.log(`[${new Date().toISOString()}] Arquivo local deletado: ${key}`);
    }
    return deleted;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erro ao deletar arquivo local: ${key}`, error);
    return false;
  }
}

export async function deletarVariosArquivosLocais(keys: string[]): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const key of keys) {
    const resultado = await deletarArquivoLocal(key);
    if (resultado) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}
