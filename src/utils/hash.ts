class PasswordUtil {
  async hash(password: string): Promise<string> {
    return await Bun.password.hash(password, {
      algorithm: "argon2id",
      memoryCost: 2 ** 16,
      timeCost: 12,
    });
  }
  async verify(password: string, hash: string): Promise<boolean> {
    return await Bun.password.verify(password, hash);
  }
}

export const passwordUtil = new PasswordUtil();
