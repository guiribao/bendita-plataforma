import bcrypt from 'bcryptjs';
import Constraints from './Constraints';

export async function encrypt(senha: string) {
  let salt = await bcrypt.genSalt(Constraints.PASSWORD_SALT);
  return await bcrypt.hash(senha, salt);
}

export async function compare(senha1: string, senha2: string): Promise<Boolean> {
  return await bcrypt.compare(senha1, senha2);
}
