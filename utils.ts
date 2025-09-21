// Base58 alphabet used by Bitcoin
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
// Base58 decode function
function base58Decode(s: string): Uint8Array {
  const alphabet = BASE58_ALPHABET;
  const base = alphabet.length;
  let num = 0n;
  let multi = 1n;

  for (let i = s.length - 1; i >= 0; i--) {
    const char = s[i];
    const charIndex = alphabet.indexOf(char);
    if (charIndex === -1) {
      throw new Error(`Invalid character '${char}' in base58 string`);
    }
    num += BigInt(charIndex) * multi;
    multi *= BigInt(base);
  }

  // Convert to bytes
  const bytes: number[] = [];
  while (num > 0n) {
    bytes.unshift(Number(num % 256n));
    num = num / 256n;
  }

  // Add leading zeros for leading '1's in the string
  for (let i = 0; i < s.length && s[i] === '1'; i++) {
    bytes.unshift(0);
  }

  return new Uint8Array(bytes);
}
// SHA-256 implementation

async function sha256(data: ArrayBuffer): Promise<ArrayBuffer> {
  return crypto.subtle.digest('SHA-256', data);
}
// Double SHA-256 (used in Bitcoin)

async function doubleSha256(data: ArrayBuffer): Promise<ArrayBuffer> {
  return sha256(data).then(sha256);
}
// Convert string to UTF-8 bytes
function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}
// Convert hex string to bytes
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
// Convert bytes to hex string
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}
// Base64 decode
export function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
// Verify Bitcoin address format and extract hash160
function getAddressHash160(address: string): Uint8Array {
  try {
    const decoded = base58Decode(address);

    // Bitcoin address should be 25 bytes (1 version + 20 hash160 + 4 checksum)
    if (decoded.length !== 25) {
      throw new Error('Invalid address length');
    }

    // Extract version, hash160, and checksum
    const version = decoded[0];
    const hash160 = decoded.slice(1, 21);
    const checksum = decoded.slice(21, 25);

    // Verify version (0x00 for P2PKH mainnet)
    if (version !== 0x00) {
      throw new Error('Unsupported address version');
    }

    return hash160;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid Bitcoin address: ${errorMessage}`);
  }
}
// Simple modular arithmetic for secp256k1
const SECP256K1_P = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn;
const SECP256K1_N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
// Modular inverse using extended Euclidean algorithm
function modInverse(a: bigint, m: bigint): bigint {
  if (a < 0n) a = ((a % m) + m) % m;

  let [old_r, r] = [a, m];
  let [old_s, s] = [1n, 0n];

  while (r !== 0n) {
    const quotient = old_r / r;[old_r, r] = [r, old_r - quotient * r];[old_s, s] = [s, old_s - quotient * s];
  }

  return old_r > 1n ? 0n : (old_s < 0n ? old_s + m : old_s);
}
// Point on secp256k1 curve
interface Point {
  x: bigint;
  y: bigint;
}
// secp256k1 generator point
const G: Point = {
  x: 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
  y: 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n
};
// Point addition on secp256k1
function pointAdd(p1: Point | null, p2: Point | null): Point | null {
  if (!p1) return p2;
  if (!p2) return p1;

  if (p1.x === p2.x) {
    if (p1.y === p2.y) {
      // Point doubling
      const s = (3n * p1.x * p1.x * modInverse(2n * p1.y, SECP256K1_P)) % SECP256K1_P;
      const x3 = (s * s - 2n * p1.x) % SECP256K1_P;
      const y3 = (s * (p1.x - x3) - p1.y) % SECP256K1_P;
      return { x: x3 < 0n ? x3 + SECP256K1_P : x3, y: y3 < 0n ? y3 + SECP256K1_P : y3 };
    } else {
      // Points are inverses
      return null;
    }
  }

  const s = ((p2.y - p1.y) * modInverse(p2.x - p1.x, SECP256K1_P)) % SECP256K1_P;
  const x3 = (s * s - p1.x - p2.x) % SECP256K1_P;
  const y3 = (s * (p1.x - x3) - p1.y) % SECP256K1_P;
  return { x: x3 < 0n ? x3 + SECP256K1_P : x3, y: y3 < 0n ? y3 + SECP256K1_P : y3 };
}
// Scalar multiplication
function pointMultiply(k: bigint, point: Point): Point | null {
  if (k === 0n) return null;
  if (k === 1n) return point;

  let result: Point | null = null;
  let addend = point;

  while (k > 0n) {
    if (k & 1n) {
      result = pointAdd(result, addend);
    }
    addend = pointAdd(addend, addend)!;
    k >>= 1n;
  }

  return result;
}
// Recover public key from signature
export function recoverPublicKey(messageHash: Uint8Array, signature: Uint8Array, recoveryId: number): Point | null {
  if (signature.length !== 64) return null;

  const r = BigInt('0x' + bytesToHex(signature.slice(0, 32)));
  const s = BigInt('0x' + bytesToHex(signature.slice(32, 64)));
  const e = BigInt('0x' + bytesToHex(messageHash));

  if (r >= SECP256K1_N || s >= SECP256K1_N) return null;

  // Calculate point R
  const x = r + (BigInt(recoveryId >> 1) * SECP256K1_N);
  if (x >= SECP256K1_P) return null;

  // Calculate y coordinate
  const ySq = (x * x * x + 7n) % SECP256K1_P;
  let y = modPow(ySq, (SECP256K1_P + 1n) / 4n, SECP256K1_P);

  if (y % 2n !== BigInt(recoveryId & 1)) {
    y = SECP256K1_P - y;
  }

  const R: Point = { x, y };

  // Calculate public key: Q = r^-1 * (s*R - e*G)
  const rInv = modInverse(r, SECP256K1_N);
  const sR = pointMultiply(s, R);
  const eG = pointMultiply(e, G);

  if (!sR || !eG) return null;

  const negEG: Point = { x: eG.x, y: SECP256K1_P - eG.y };
  const diff = pointAdd(sR, negEG);

  if (!diff) return null;

  return pointMultiply(rInv, diff);
}
// Modular exponentiation
function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) {
      result = (result * base) % mod;
    }
    exp = exp >> 1n;
    base = (base * base) % mod;
  }
  return result;
}
// Encode varint (variable-length integer)
function encodeVarint(n: number): Uint8Array {
  if (n < 0xfd) {
    return new Uint8Array([n]);
  } else if (n <= 0xffff) {
    return new Uint8Array([0xfd, n & 0xff, (n >> 8) & 0xff]);
  } else if (n <= 0xffffffff) {
    return new Uint8Array([0xfe, n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff]);
  } else {
    throw new Error('Number too large for varint encoding');
  }
}
// Create Bitcoin message hash
export async function createMessageHash(message: string): Promise<Uint8Array> {
  const prefix = 'Bitcoin Signed Message:\n';
  const prefixBytes = stringToBytes(prefix);
  const messageBytes = stringToBytes(message);

  // Create the message with varint length prefixes (Bitcoin's format)
  const prefixLength = encodeVarint(prefixBytes.length);
  const messageLength = encodeVarint(messageBytes.length);

  // Concatenate: varint_prefix_length + prefix + varint_message_length + message
  const fullMessage = new Uint8Array(
    prefixLength.length + prefixBytes.length + messageLength.length + messageBytes.length
  );

  let offset = 0;
  fullMessage.set(prefixLength, offset);
  offset += prefixLength.length;
  fullMessage.set(prefixBytes, offset);
  offset += prefixBytes.length;
  fullMessage.set(messageLength, offset);
  offset += messageLength.length;
  fullMessage.set(messageBytes, offset);

  // Double SHA-256 hash
  const hashBuffer = await doubleSha256(fullMessage.buffer);
  return new Uint8Array(hashBuffer);
}
// Convert public key point to Bitcoin address
export async function publicKeyToAddress(publicKey: Point, compressed: boolean = true): Promise<string> {
  let publicKeyBytes: Uint8Array;

  if (compressed) {
    // Compressed format: 33 bytes (0x02/0x03 + x coordinate)
    publicKeyBytes = new Uint8Array(33);
    publicKeyBytes[0] = publicKey.y % 2n === 0n ? 0x02 : 0x03;

    // Convert x coordinate to bytes (32 bytes, big-endian)
    const xBytes = publicKey.x.toString(16).padStart(64, '0');
    for (let i = 0; i < 32; i++) {
      publicKeyBytes[i + 1] = parseInt(xBytes.substring(i * 2, i * 2 + 2), 16);
    }
  } else {
    // Uncompressed format: 65 bytes (0x04 + x coordinate + y coordinate)
    publicKeyBytes = new Uint8Array(65);
    publicKeyBytes[0] = 0x04;

    // Convert x coordinate to bytes (32 bytes, big-endian)
    const xBytes = publicKey.x.toString(16).padStart(64, '0');
    for (let i = 0; i < 32; i++) {
      publicKeyBytes[i + 1] = parseInt(xBytes.substring(i * 2, i * 2 + 2), 16);
    }

    // Convert y coordinate to bytes (32 bytes, big-endian)
    const yBytes = publicKey.y.toString(16).padStart(64, '0');
    for (let i = 0; i < 32; i++) {
      publicKeyBytes[i + 33] = parseInt(yBytes.substring(i * 2, i * 2 + 2), 16);
    }
  }

  // Hash the public key
  const sha256Hash = await sha256(publicKeyBytes.buffer as ArrayBuffer);
  const ripemd160Hash = ripemd160(new Uint8Array(sha256Hash));

  // Add version byte (0x00 for mainnet P2PKH)
  const versioned = new Uint8Array(21);
  versioned[0] = 0x00;
  versioned.set(ripemd160Hash.slice(0, 20), 1);

  // Calculate checksum (first 4 bytes of double SHA-256)
  const checksumBuffer = await doubleSha256(versioned.buffer);
  const checksum = new Uint8Array(checksumBuffer);

  // Combine version + hash + checksum
  const fullAddress = new Uint8Array(25);
  fullAddress.set(versioned, 0);
  fullAddress.set(checksum.slice(0, 4), 21);

  // Encode as Base58
  return base58Encode(fullAddress);
}
// Base58 encode function
function base58Encode(bytes: Uint8Array): string {
  const alphabet = BASE58_ALPHABET;
  const base = BigInt(alphabet.length);

  // Convert bytes to big integer
  let num = 0n;
  for (let i = 0; i < bytes.length; i++) {
    num = num * 256n + BigInt(bytes[i]);
  }

  // Convert to base58
  let result = '';
  while (num > 0n) {
    const remainder = num % base;
    result = alphabet[Number(remainder)] + result;
    num = num / base;
  }

  // Add leading '1's for leading zero bytes
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    result = '1' + result;
  }

  return result;
}
