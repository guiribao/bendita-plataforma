import { useEffect, useRef, useState } from 'react';
import {
  TAMANHO_MAXIMO_ARQUIVO,
  TAMANHO_MAXIMO_ARQUIVO_LABEL,
  comprimirImagem,
  formatarTamanhoArquivo,
  substituirArquivosDoInput,
} from '~/shared/Arquivo.util';

type Props = {
  /** Mensagem exibida enquanto os anexos estão sendo comprimidos. */
  mensagem?: string;
};

/**
 * Coloque dentro de um <Form> com campos de arquivo: antes do envio ele comprime
 * as imagens selecionadas no próprio navegador e bloqueia o envio de arquivos
 * que continuem acima do limite aceito pelo servidor.
 */
export default function CompressorDeAnexos({ mensagem = 'Otimizando anexos...' }: Props) {
  const marcadorRef = useRef<HTMLSpanElement>(null);
  const [otimizando, setOtimizando] = useState(false);
  const [erros, setErros] = useState<string[]>([]);

  useEffect(() => {
    const form = marcadorRef.current?.closest('form');
    if (!form) return;

    // arquivos que já passaram pela compressão, para não comprimir duas vezes
    const jaProcessados = new WeakSet<File>();
    let processando = false;
    let liberado = false;

    const aoEnviar = async (event: Event) => {
      if (liberado) {
        liberado = false;
        return;
      }

      if (processando) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      const inputs = Array.from(form.querySelectorAll<HTMLInputElement>('input[type="file"]'))
        .filter((input) => !input.disabled && input.files && input.files.length > 0);

      const pendentes = inputs.filter((input) =>
        Array.from(input.files!).some((arquivo) => !jaProcessados.has(arquivo)));

      if (!pendentes.length) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const submitter = (event as SubmitEvent).submitter;

      processando = true;
      setOtimizando(true);
      setErros([]);

      const problemas: string[] = [];

      try {
        for (const input of pendentes) {
          const otimizados: File[] = [];

          for (const arquivo of Array.from(input.files!)) {
            const otimizado = jaProcessados.has(arquivo) ? arquivo : await comprimirImagem(arquivo);
            jaProcessados.add(otimizado);
            otimizados.push(otimizado);

            if (otimizado.size > TAMANHO_MAXIMO_ARQUIVO) {
              problemas.push(
                `${arquivo.name} tem ${formatarTamanhoArquivo(otimizado.size)}. Envie um arquivo de até ${TAMANHO_MAXIMO_ARQUIVO_LABEL}.`,
              );
            }
          }

          substituirArquivosDoInput(input, otimizados);
        }
      } finally {
        processando = false;
        setOtimizando(false);
      }

      if (problemas.length) {
        setErros(problemas);
        return;
      }

      liberado = true;
      if (submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement) {
        form.requestSubmit(submitter);
      } else {
        form.requestSubmit();
      }
    };

    form.addEventListener('submit', aoEnviar, true);
    return () => form.removeEventListener('submit', aoEnviar, true);
  }, []);

  return (
    <>
      <span ref={marcadorRef} hidden aria-hidden='true' />
      {otimizando && (
        <p className='text-muted small mb-2' role='status'>
          {mensagem}
        </p>
      )}
      {erros.length > 0 && (
        <div className='mensagem-erro text-danger small mb-2' role='alert'>
          {erros.map((erro) => (
            <p key={erro} className='mb-1'>{erro}</p>
          ))}
        </div>
      )}
    </>
  );
}
