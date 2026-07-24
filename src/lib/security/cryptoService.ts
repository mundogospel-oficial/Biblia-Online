/**
 * End-to-End Cryptography Engine for AI System (AES-256-GCM)
 * Protects prompts, responses, and conversation history both in-transit and at-rest.
 * Uses native Web Crypto API (SubtleCrypto) for zero-dependency high-performance security.
 */

const ENCRYPTION_PREFIX = "enc:v1:";
const DEFAULT_SALT_PHRASE = "BibliaOnline_AI_ZeroKnowledgeVault_2026";

/**
 * Derives a 256-bit AES-GCM Key using PBKDF2 with 100,000 iterations
 */
async function deriveKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret || DEFAULT_SALT_PHRASE),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypts a text string with AES-256-GCM
 */
export async function encryptPayload(
  text: string,
  userSecret: string = DEFAULT_SALT_PHRASE
): Promise<string> {
  if (!text || typeof text !== "string" || text.startsWith(ENCRYPTION_PREFIX)) {
    return text;
  }

  try {
    const enc = new TextEncoder();
    const data = enc.encode(text);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await deriveKey(userSecret, salt);
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      data
    );

    const saltB64 = bufferToBase64(salt.buffer);
    const ivB64 = bufferToBase64(iv.buffer);
    const cipherB64 = bufferToBase64(encrypted);

    return `${ENCRYPTION_PREFIX}${saltB64}:${ivB64}:${cipherB64}`;
  } catch (err) {
    console.warn("[CryptoService] Fallback de segurança para payload:", err);
    return text;
  }
}

/**
 * Decrypts an AES-256-GCM payload. Returns original text if not encrypted.
 */
export async function decryptPayload(
  encryptedText: string,
  userSecret: string = DEFAULT_SALT_PHRASE
): Promise<string> {
  if (!encryptedText || typeof encryptedText !== "string" || !encryptedText.startsWith(ENCRYPTION_PREFIX)) {
    return encryptedText;
  }

  try {
    const body = encryptedText.substring(ENCRYPTION_PREFIX.length);
    const parts = body.split(":");
    if (parts.length !== 3) return encryptedText;

    const [saltB64, ivB64, cipherB64] = parts;
    const salt = new Uint8Array(base64ToBuffer(saltB64));
    const iv = new Uint8Array(base64ToBuffer(ivB64));
    const cipher = base64ToBuffer(cipherB64);

    const key = await deriveKey(userSecret, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      cipher
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (err) {
    console.warn("[CryptoService] Não foi possível descriptografar o payload (pode estar em formato legível antigo):", err);
    return encryptedText;
  }
}

/**
 * Encrypts an entire conversation object or message list for local/remote storage
 */
export async function encryptConversationMessages<T extends { content: string }>(
  messages: T[],
  userSecret?: string
): Promise<T[]> {
  if (!Array.isArray(messages)) return messages;
  const encrypted = await Promise.all(
    messages.map(async (msg) => {
      if (!msg.content) return msg;
      const encContent = await encryptPayload(msg.content, userSecret);
      return { ...msg, content: encContent };
    })
  );
  return encrypted;
}

/**
 * Decrypts conversation messages
 */
export async function decryptConversationMessages<T extends { content: string }>(
  messages: T[],
  userSecret?: string
): Promise<T[]> {
  if (!Array.isArray(messages)) return messages;
  const decrypted = await Promise.all(
    messages.map(async (msg) => {
      if (!msg.content) return msg;
      const decContent = await decryptPayload(msg.content, userSecret);
      return { ...msg, content: decContent };
    })
  );
  return decrypted;
}
