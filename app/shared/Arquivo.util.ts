/** Tamanho máximo aceito por arquivo enviado (15mb). Deve espelhar o limite do back-end. */
export const TAMANHO_MAXIMO_ARQUIVO = 15 * 1024 * 1024;
export const TAMANHO_MAXIMO_ARQUIVO_LABEL = '15MB';

/** Formatos aceitos nos campos de anexo. */
export const FORMATOS_ARQUIVO_ACEITOS = ['image/jpeg', 'image/png', 'application/pdf'];
export const ACCEPT_ARQUIVO = '.jpg,.jpeg,.png,.pdf';

/** Parâmetros da compressão feita no navegador, antes do envio. */
const DIMENSAO_MAXIMA = 2000;
const QUALIDADE_INICIAL = 0.75;
const QUALIDADE_MINIMA = 0.4;
const TAMANHO_ALVO = 4 * 1024 * 1024;

function trocarExtensaoParaJpeg(nome: string) {
  return `${nome.replace(/\.[^.]+$/, '')}.jpeg`;
}

async function carregarImagem(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // navegadores antigos não suportam a opção de orientação; cai para o <img>
    }
  }

  const url = URL.createObjectURL(file);

  try {
    return await new Promise((resolve, reject) => {
      const imagem = new Image();
      imagem.onload = () => resolve(imagem);
      imagem.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
      imagem.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasParaBlob(canvas: HTMLCanvasElement, qualidade: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', qualidade));
}

/**
 * Reduz dimensões e qualidade da imagem no navegador para que o envio caiba no
 * limite do servidor. PDFs e arquivos que não puderem ser lidos são devolvidos
 * sem alteração.
 */
export async function comprimirImagem(file: File): Promise<File> {
  if (typeof document === 'undefined') return file;
  if (!file.type.startsWith('image/')) return file;

  try {
    const imagem = await carregarImagem(file);
    const escala = Math.min(1, DIMENSAO_MAXIMA / Math.max(imagem.width, imagem.height));

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(imagem.width * escala));
    canvas.height = Math.max(1, Math.round(imagem.height * escala));

    const contexto = canvas.getContext('2d');
    if (!contexto) return file;

    // fundo branco para não escurecer PNGs com transparência ao virar JPEG
    contexto.fillStyle = '#ffffff';
    contexto.fillRect(0, 0, canvas.width, canvas.height);
    contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);

    if (typeof ImageBitmap !== 'undefined' && imagem instanceof ImageBitmap) imagem.close();

    let qualidade = QUALIDADE_INICIAL;
    let blob = await canvasParaBlob(canvas, qualidade);

    while (blob && blob.size > TAMANHO_ALVO && qualidade > QUALIDADE_MINIMA) {
      qualidade = Number((qualidade - 0.15).toFixed(2));
      blob = await canvasParaBlob(canvas, qualidade);
    }

    if (!blob || blob.size >= file.size) return file;

    return new File([blob], trocarExtensaoParaJpeg(file.name), {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Não foi possível comprimir a imagem selecionada:', error);
    return file;
  }
}

/** Substitui os arquivos de um input file. Retorna false se o navegador não permitir. */
export function substituirArquivosDoInput(input: HTMLInputElement, arquivos: File[]) {
  try {
    const transferencia = new DataTransfer();
    arquivos.forEach((arquivo) => transferencia.items.add(arquivo));
    input.files = transferencia.files;
    return true;
  } catch (error) {
    console.error('Navegador não permitiu substituir o arquivo selecionado:', error);
    return false;
  }
}

export function formatarTamanhoArquivo(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
