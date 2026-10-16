import { createCipheriv, createDecipheriv, createHmac, randomBytes, createHash } from "node:crypto";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function encryptionKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters.");
  return createHash("sha256").update(secret).digest();
}
export function generateTotpSecret() {
  const bytes = randomBytes(20);
  let bits = "";
  for (const byte of bytes) bits += byte.toString(2).padStart(8, "0");
  let output = "";
  for (let i = 0; i < bits.length; i += 5) output += ALPHABET[parseInt(bits.slice(i, i + 5).padEnd(5, "0"), 2)];
  return output;
}
function decodeBase32(input: string) {
  const normalized = input.toUpperCase().replace(/=+$/g, "").replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const char of normalized) bits += ALPHABET.indexOf(char).toString(2).padStart(5, "0");
  const out: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(out);
}
export function encryptTotpSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString("base64url")).join(".");
}
export function decryptTotpSecret(value: string) {
  const parts = value.split(".");
  if (parts.length !== 3) throw new Error("Invalid encrypted TOTP secret.");
  const [iv, tag, ciphertext] = parts.map((part) => Buffer.from(part, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
function codeAt(secret: string, counter: number) {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", decodeBase32(secret)).update(message).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = ((digest[offset] & 0x7f) << 24) | ((digest[offset + 1] & 0xff) << 16) | ((digest[offset + 2] & 0xff) << 8) | (digest[offset + 3] & 0xff);
  return String(binary % 1000000).padStart(6, "0");
}
export function verifyTotp(secret: string, supplied: string, now = Date.now()) {
  if (!/^\d{6}$/.test(supplied)) return false;
  const counter = Math.floor(now / 30000);
  for (const drift of [-1, 0, 1]) {
    const expected = Buffer.from(codeAt(secret, counter + drift));
    const actual = Buffer.from(supplied);
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ actual[i];
    if (diff === 0) return true;
  }
  return false;
}
export function totpUri(email: string, secret: string) {
  return "otpauth://totp/" + encodeURIComponent("Veltron Digital:" + email) + "?secret=" + secret + "&issuer=Veltron%20Digital&algorithm=SHA1&digits=6&period=30";
}
