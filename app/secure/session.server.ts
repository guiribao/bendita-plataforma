import { createCookieSessionStorage } from "@remix-run/node";

if(!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET não foi configurado nas variaveis de ambiente');
}

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__chave__", // use any name you want here
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

export { sessionStorage }