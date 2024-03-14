import bcrypt from 'bcryptjs';

const PASSWORD_SALT = process.env.PASSWORD_SALT

export async function encrypt(senha: string) {
  let salt = await bcrypt.genSalt(PASSWORD_SALT);
  return await bcrypt.hash(senha, salt);
}

export async function compare(senha1: string, senha2: string): Promise<Boolean> {
  return await bcrypt.compare(senha1, senha2);
}

export function createRandomPassword(tamanho: number) {
    var stringAleatoria = '';
    var caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < tamanho; i++) {
        stringAleatoria += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return stringAleatoria;
}