import bcrypt from 'bcryptjs';

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, 10);
export const comparePassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);
