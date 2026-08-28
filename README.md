# Welcome to Remix!

- [Remix Docs](https://remix.run/docs)

## Development

From your terminal:

```sh
npm run dev
```

This starts your app in development mode, rebuilding assets on file changes.

## Deployment

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `remix build`

- `build/`
- `public/build/`

## Armazenamento e e-mail

Uploads e documentos são gravados localmente em `storage-private/`. O projeto
não usa S3 para arquivos. Os pacotes `@aws-sdk/*` que aparecem no lockfile são
dependências transitivas do transporte de e-mail SES usado por `nodemailer`,
quando configurado, e não participam do fluxo de upload.
