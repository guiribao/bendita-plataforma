import { promises as fs } from 'node:fs';
import path from 'node:path';

const STORAGE_PRIVATE_DIR = path.resolve(process.cwd(), 'storage-private');

function normalizeStorageKey(key: string): string {
  const normalized = key.replaceAll('\\', '/').replace(/^\/+/, '');
  const safeKey = path.posix.normalize(normalized);

  if (!safeKey || safeKey.startsWith('..') || path.isAbsolute(safeKey)) {
    throw new Error(`Storage key inválida: ${key}`);
  }

  return safeKey;
}

function resolveStoragePath(key: string): string {
  const safeKey = normalizeStorageKey(key);
  const absolutePath = path.resolve(STORAGE_PRIVATE_DIR, safeKey);

  if (!absolutePath.startsWith(`${STORAGE_PRIVATE_DIR}${path.sep}`)) {
    throw new Error(`Tentativa de acesso fora do diretório de storage: ${key}`);
  }

  return absolutePath;
}

export async function writeStorageFile(key: string, data: Buffer): Promise<void> {
  const absolutePath = resolveStoragePath(key);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, data);
}

export async function deleteStorageFile(key: string): Promise<boolean> {
  const absolutePath = resolveStoragePath(key);

  try {
    await fs.unlink(absolutePath);
    return true;
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return true;
    }

    throw error;
  }
}

export async function readStorageFile(key: string): Promise<Buffer> {
  const absolutePath = resolveStoragePath(key);
  return fs.readFile(absolutePath);
}
