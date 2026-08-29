# Upload de arquivos

## Limite

O limite por arquivo é **15MB**, definido em [`app/shared/Arquivo.util.ts`](../app/shared/Arquivo.util.ts)
(`TAMANHO_MAXIMO_ARQUIVO`) e usado tanto pelo front-end quanto pelo handler de
upload do servidor (`app/storage/local-upload.server.ts`).

Formatos aceitos: JPG, PNG e PDF.

## Compressão

- **No navegador**, antes do envio: o componente `CompressorDeAnexos` intercepta o
  submit do formulário, redimensiona as imagens para no máximo 2000px e converte
  para JPEG (qualidade 0.75, reduzida até 0.4 se o arquivo ficar acima de 4MB).
  PDFs são enviados como estão. Se o arquivo continuar acima de 15MB o envio é
  bloqueado com mensagem na própria tela.
- **No servidor**, antes de gravar: imagens passam pelo Jimp com
  `scaleToFit(2000, 2000)` e qualidade 70.

Telas com compressão ativa: `/cadastro/documentos`, `/cadastro/saude`,
`/cadastro/responsavel`, `/app/documentos/novo`, `/app/gente/novo` e
`/app/gente/:id/editar`.

## nginx (produção)

O `client_max_body_size` padrão do nginx é **1MB**. Acima disso o nginx responde
413 com uma página HTML antes de a requisição chegar na aplicação — e o Remix
falha com `Unable to decode turbo-stream response from URL: .../novo.data`.

No server block do `benditacanabica.com.br`:

```nginx
server {
    # ...
    client_max_body_size 20m;
    client_body_timeout 120s;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_request_buffering off;
        # ...
    }
}
```

Depois: `sudo nginx -t && sudo systemctl reload nginx`.

A folga de 20m cobre os 15MB do arquivo mais o overhead do multipart e os demais
campos do formulário.
