/**
 * Bitcoin Message Signature Verifier
 *
 * A complete dependency-free implementation of Bitcoin message signature verification
 * that works in modern browsers using only Web APIs.
 */

// Export RPC functionality for Bitcoin node communication
export * as rpc from './rpc'

// Union type for message input - can be string or raw bytes
type StringOrBytes = string | Uint8Array

// Main interface for verification parameters
export interface Payload {
  /** The message that was signed */
  message: StringOrBytes
  /** Bitcoin address that should have signed the message */
  address: string
  /** Base64 - encoded signature to verify */
  signature: string
}

// Utility function to throw errors consistently
export function fail(error: unknown): never {
  throw error instanceof Error ? error : new Error(error as string)
}

// Assertion helper with TypeScript type narrowing
export function assert(condition: unknown, error: unknown = 'Assertion failed'): asserts condition {
  if (!condition) fail(error)
}

/**
 * Checks if a Bitcoin message signature is valid
 *
 * Bitcoin message signatures work by:
 * 1. Creating a standardized hash of the message
 * 2. Recovering the public key from the signature
 * 3. Converting the public key to a Bitcoin address
 * 4. Comparing with the claimed address
 */
export default async function verify({ message, address, signature }: Payload) {
  // Decode the base64 signature into raw bytes
  const sigBytes = base64ToBytes(signature)
  assert(sigBytes.length === 65, `Invalid signature length: ${sigBytes.length}, expected 65`)

  // Bitcoin message signatures use recovery flags 27-34 to indicate:
  // - Which of 4 possible public keys to recover (27-30)
  // - Whether the address uses compressed format (31-34)
  const recoveryFlag = sigBytes[0]
  assert(recoveryFlag >= 27, 'Invalid recovery flag')
  assert(recoveryFlag <= 34, 'Invalid recovery flag')

  // Extract the actual signature data (64 bytes: 32-byte r + 32-byte s)
  const signatureData = sigBytes.slice(1)

  // Convert message to bytes and create Bitcoin-standard message hash
  const messageBytes = typeof message === 'string' ? encoder.encode(message) : message
  const messageHash = await createMessageHash(messageBytes)

  // Bitcoin signatures can recover 4 different public keys due to elliptic curve math
  // We try each recovery ID (0-3) and both compressed/uncompressed address formats
  for (let testRecoveryId = 0; testRecoveryId < 4; testRecoveryId++) {
    const publicKey = recoverPublicKey(messageHash, signatureData, testRecoveryId)
    if (publicKey) {
      // Try both compressed and uncompressed address formats
      for (const compressed of [true, false]) {
        const testAddress = await publicKeyToAddress(publicKey, compressed)
        if (testAddress === address) {
          return true // Found matching address - signature is valid!
        }
      }
    }
  }

  fail('Unable to recover public key from signature')
}

/**
 * Safe version of `verify` that returns false instead of throwing errors
 * Useful for UI applications where you don't want exceptions
 */
export async function verifySafe(params: Payload, log = true) {
  try {
    return await verify(params)
  } catch (error) {
    if (log) console.error(error)
    return false
  }
}

/**
 * Parse and format message payload for display/debugging
 * Handles both string and binary message formats
 */
export function parsePayload({ address, message, signature }: Payload) {
  let bytes = message as Uint8Array
  let utf8 = String(message)
  let hex = toHexString(utf8)

  if (typeof message === 'string') {
    // If string looks like hex (starts with 0x), convert to bytes
    if (hex) {
      bytes = new Uint8Array(hex.length / 2)
      for (let i = 0; i < bytes.byteLength; i++)
        bytes[i] = parseInt(hex[i * 2] + hex[i * 2 + 1], 16)
    } else {
      // Regular string - encode as UTF-8
      bytes = encoder.encode(utf8)
    }
  } else if (message instanceof Uint8Array) {
    // Binary data - convert to hex string for display
    utf8 = bytesToHex(bytes, ' ').toUpperCase()
    // Could also decode as text: new TextDecoder().decode(bytes)
  }

  return { address, signature, message: { bytes, utf8, hex } }
}

/**
 * Check if a string is valid hexadecimal format (0x prefix, even length, hex chars only)
 * Returns the hex string without 0x prefix, or undefined if invalid
 */
function toHexString(str: string) {
  try {
    assert(str.startsWith('0x'), 'Must start with 0x')
    assert(str.length % 2 === 0, 'Must be even length')
    assert(/^0x[a-f\d\s]+$/i.test(str), 'Must be hex characters only')
    return str.substring(2).replaceAll(/\s/g, '')
  } catch {
    // Return undefined if validation fails
  }
}

// ============================================================================
// CRYPTOGRAPHIC FUNCTIONS
// ============================================================================

// Pure TypeScript RIPEMD-160 implementation following RFC 1320

// Base58 alphabet used by Bitcoin (excludes 0, O, I, l to avoid confusion)
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

// Text encoder for converting strings to UTF-8 bytes
const encoder = new TextEncoder()

/** SHA-256 hash using Web Crypto API*/
async function sha256(data: ArrayBuffer): Promise<ArrayBuffer> {
  return crypto.subtle.digest('SHA-256', data)
}

/** Double SHA-256 hash (SHA-256 of SHA-256) - used extensively in Bitcoin */
async function doubleSha256(data: ArrayBuffer): Promise<ArrayBuffer> {
  return sha256(data).then(sha256)
}

/** Convert byte array to hexadecimal string representation */
export function bytesToHex(bytes: Uint8Array, delimiter = ''): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join(delimiter)
}

/**
 * RIPEMD-160 hash function implementation
 * Used in Bitcoin for creating addresses from public keys
 *
 * WWC needs to include this in the SubtleCrypto API
 *
 * @param data Input data to hash
 * @returns 20-byte RIPEMD-160 hash
 */
function ripemd160(data: Uint8Array): Uint8Array {
  // RIPEMD-160 round constants for left and right processing lines
  const K_LEFT = [0x00000000, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xa953fd4e]
  const K_RIGHT = [0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x7a6d76e9, 0x00000000]

  // Message word selection order for left processing line (80 rounds)
  const R_LEFT = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2,
    14, 11, 8, 3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12, 1, 9, 11, 10, 0, 8, 12, 4, 13,
    3, 7, 15, 14, 5, 6, 2, 4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13,
  ]

  // Message word selection order for right processing line (80 rounds)
  const R_RIGHT = [
    5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12, 6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12,
    4, 9, 1, 2, 15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13, 8, 6, 4, 1, 3, 11, 15, 0, 5,
    12, 2, 13, 9, 7, 10, 14, 12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11,
  ]

  // Left rotate amounts for left processing line
  const S_LEFT = [
    11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8, 7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9,
    11, 7, 13, 12, 11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5, 11, 12, 14, 15, 14, 15,
    9, 8, 9, 14, 5, 6, 8, 6, 5, 12, 9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6,
  ]

  // Left rotate amounts for right processing line
  const S_RIGHT = [
    8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6, 9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7,
    6, 15, 13, 11, 9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5, 15, 5, 8, 11, 14, 14, 6,
    14, 6, 9, 12, 9, 12, 5, 15, 8, 8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11,
  ]

  // Bitwise left rotation helper function
  const rotateLeft = (n: number, b: number) => (n << b) | (n >>> (32 - b))

  // RIPEMD-160 round function - different for each group of 16 rounds
  const f = (j: number, x: number, y: number, z: number) => {
    if (j < 16) return x ^ y ^ z // XOR for rounds 0-15
    if (j < 32) return (x & y) | (~x & z) // Selection for rounds 16-31
    if (j < 48) return (x | ~y) ^ z // Majority for rounds 32-47
    if (j < 64) return (x & z) | (y & ~z) // Selection for rounds 48-63
    return x ^ (y | ~z) // XOR for rounds 64-79
  }

  // Message padding (required by RIPEMD-160 specification)
  const msgLen = data.length
  const bitLen = msgLen * 8

  // Pad message to multiple of 512 bits (64 bytes) with room for length
  const paddedLen = Math.ceil((msgLen + 9) / 64) * 64
  const padded = new Uint8Array(paddedLen)
  padded.set(data)
  padded[msgLen] = 0x80 // Append single '1' bit followed by zeros

  // Append original message length as 64-bit little-endian integer
  const view = new DataView(padded.buffer)
  view.setUint32(paddedLen - 8, bitLen & 0xffffffff, true)
  view.setUint32(paddedLen - 4, Math.floor(bitLen / 0x100000000), true)

  // Initialize RIPEMD-160 hash state (5 32-bit words)
  let h0 = 0x67452301
  let h1 = 0xefcdab89
  let h2 = 0x98badcfe
  let h3 = 0x10325476
  let h4 = 0xc3d2e1f0

  // Process message in 512-bit (64-byte) chunks
  for (let chunk = 0; chunk < paddedLen; chunk += 64) {
    // Break chunk into 16 32-bit little-endian words
    const w = new Array(16)
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(chunk + i * 4, true)
    }

    // Initialize working variables for left and right processing lines
    let al = h0,
      bl = h1,
      cl = h2,
      dl = h3,
      el = h4 // Left line
    let ar = h0,
      br = h1,
      cr = h2,
      dr = h3,
      er = h4 // Right line

    // Perform 80 rounds of processing (dual parallel lines)
    for (let j = 0; j < 80; j++) {
      // Left processing line
      let t = (al + f(j, bl, cl, dl) + w[R_LEFT[j]] + K_LEFT[Math.floor(j / 16)]) >>> 0
      t = rotateLeft(t, S_LEFT[j]) + el
      al = el
      el = dl
      dl = rotateLeft(cl, 10)
      cl = bl
      bl = t >>> 0

      // Right processing line (uses inverted round order)
      t = (ar + f(79 - j, br, cr, dr) + w[R_RIGHT[j]] + K_RIGHT[Math.floor(j / 16)]) >>> 0
      t = rotateLeft(t, S_RIGHT[j]) + er
      ar = er
      er = dr
      dr = rotateLeft(cr, 10)
      cr = br
      br = t >>> 0
    }

    // Combine results from both processing lines
    const t = (h1 + cl + dr) >>> 0
    h1 = (h2 + dl + er) >>> 0
    h2 = (h3 + el + ar) >>> 0
    h3 = (h4 + al + br) >>> 0
    h4 = (h0 + bl + cr) >>> 0
    h0 = t
  }

  // Convert final hash state to 20-byte result (little-endian)
  const result = new Uint8Array(20)
  const resultView = new DataView(result.buffer)
  resultView.setUint32(0, h0, true)
  resultView.setUint32(4, h1, true)
  resultView.setUint32(8, h2, true)
  resultView.setUint32(12, h3, true)
  resultView.setUint32(16, h4, true)

  return result
}
// ============================================================================
// BASE64 AND SECP256K1 ELLIPTIC CURVE FUNCTIONS
// ============================================================================

/**
 * Decode base64 string to byte array
 * Used for decoding Bitcoin message signatures
 */
function base64ToBytes(base64: string) {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++)
    bytes[i] = binaryString.charCodeAt(i)
  return bytes
}

// secp256k1 elliptic curve constants (Bitcoin uses this curve)
const SECP256K1_P = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn // Field prime
const SECP256K1_N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n // Curve order

/**
 * Point on the secp256k1 elliptic curve
 * Represents a public key or intermediate calculation result
 */
interface Point {
  x: bigint // X coordinate
  y: bigint // Y coordinate
}

/**
 * secp256k1 generator point G
 * This is the base point used to generate all other points on the curve
 * All Bitcoin public keys are multiples of this point
 */
const G: Point = {
  x: 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
  y: 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n,
}

/**
 * Calculate modular multiplicative inverse using extended Euclidean algorithm
 * Used for elliptic curve point operations
 *
 * @param a Number to find inverse of
 * @param m Modulus
 * @returns Modular inverse of a mod m
 */
function modInverse(a: bigint, m: bigint): bigint {
  if (a < 0n) a = ((a % m) + m) % m

  let [old_r, r] = [a, m]
  let [old_s, s] = [1n, 0n]

  while (r !== 0n) {
    const quotient = old_r / r
    ;[old_r, r] = [r, old_r - quotient * r]
    ;[old_s, s] = [s, old_s - quotient * s]
  }

  return old_r > 1n ? 0n : old_s < 0n ? old_s + m : old_s
}

/**
 * Add two points on the secp256k1 elliptic curve
 * Handles special cases: point at infinity, point doubling, and inverse points
 *
 * @param p1 First point (null represents point at infinity)
 * @param p2 Second point (null represents point at infinity)
 * @returns Sum of the two points, or null for point at infinity
 */
function pointAdd(p1: Point | null, p2: Point | null): Point | null {
  if (!p1) return p2 // 0 + P = P
  if (!p2) return p1 // P + 0 = P

  if (p1.x === p2.x) {
    if (p1.y === p2.y) {
      // Point doubling: P + P = 2P
      // Slope = (3x₁² + a) / (2y₁), where a=0 for secp256k1
      const s = (3n * p1.x * p1.x * modInverse(2n * p1.y, SECP256K1_P)) % SECP256K1_P
      const x3 = (s * s - 2n * p1.x) % SECP256K1_P
      const y3 = (s * (p1.x - x3) - p1.y) % SECP256K1_P
      return { x: x3 < 0n ? x3 + SECP256K1_P : x3, y: y3 < 0n ? y3 + SECP256K1_P : y3 }
    } else {
      // Points are additive inverses: P + (-P) = 0
      return null
    }
  }

  // General case: P₁ + P₂ where P₁ ≠ P₂
  // Slope = (y₂ - y₁) / (x₂ - x₁)
  const s = ((p2.y - p1.y) * modInverse(p2.x - p1.x, SECP256K1_P)) % SECP256K1_P
  const x3 = (s * s - p1.x - p2.x) % SECP256K1_P
  const y3 = (s * (p1.x - x3) - p1.y) % SECP256K1_P
  return { x: x3 < 0n ? x3 + SECP256K1_P : x3, y: y3 < 0n ? y3 + SECP256K1_P : y3 }
}

// Scalar multiplication
function pointMultiply(k: bigint, point: Point): Point | null {
  if (k === 0n) return null
  if (k === 1n) return point

  let result: Point | null = null
  let addend = point

  while (k > 0n) {
    if (k & 1n) {
      result = pointAdd(result, addend)
    }
    addend = pointAdd(addend, addend)!
    k >>= 1n
  }

  return result
}

// Modular exponentiation
function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n
  base = base % mod
  while (exp > 0n) {
    if (exp % 2n === 1n) {
      result = (result * base) % mod
    }
    exp = exp >> 1n
    base = (base * base) % mod
  }
  return result
}

// Recover public key from signature
function recoverPublicKey(
  messageHash: Uint8Array,
  signature: Uint8Array,
  recoveryId: number
): Point | null {
  if (signature.length !== 64) return null

  const r = BigInt('0x' + bytesToHex(signature.slice(0, 32)))
  const s = BigInt('0x' + bytesToHex(signature.slice(32, 64)))
  const e = BigInt('0x' + bytesToHex(messageHash))

  if (r >= SECP256K1_N || s >= SECP256K1_N) return null

  // Calculate point R
  const x = r + BigInt(recoveryId >> 1) * SECP256K1_N
  if (x >= SECP256K1_P) return null

  // Calculate y coordinate
  const ySq = (x * x * x + 7n) % SECP256K1_P
  let y = modPow(ySq, (SECP256K1_P + 1n) / 4n, SECP256K1_P)

  if (y % 2n !== BigInt(recoveryId & 1)) {
    y = SECP256K1_P - y
  }

  const R: Point = { x, y }

  // Calculate public key: Q = r^-1 * (s*R - e*G)
  const rInv = modInverse(r, SECP256K1_N)
  const sR = pointMultiply(s, R)
  const eG = pointMultiply(e, G)

  if (!sR || !eG) return null

  const negEG: Point = { x: eG.x, y: SECP256K1_P - eG.y }
  const diff = pointAdd(sR, negEG)

  if (!diff) return null

  return pointMultiply(rInv, diff)
}

// ============================================================================
// BITCOIN MESSAGE FORMATTING AND ADDRESS GENERATION
// ============================================================================

/**
 * Encode variable-length integer (varint) used in Bitcoin protocol
 * Efficiently encodes integers using 1, 3, 5, or 9 bytes depending on size
 *
 * @param n Integer to encode (must be non-negative)
 * @returns Encoded varint as byte array
 */
function encodeVarint(n: number) {
  if (n < 0xfd) {
    // Single byte for values 0-252
    return new Uint8Array([n])
  } else if (n <= 0xffff) {
    // 3 bytes: 0xfd + 2-byte little-endian value
    return new Uint8Array([0xfd, n & 0xff, (n >> 8) & 0xff])
  } else if (n <= 0xffffffff) {
    // 5 bytes: 0xfe + 4-byte little-endian value
    return new Uint8Array([0xfe, n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff])
  }
  fail('Number too large for varint encoding')
}

/**
 * Create Bitcoin message hash following the standard format
 * Bitcoin messages are prefixed with "Bitcoin Signed Message:\n" and length-encoded
 *
 * @param messageBytes Raw message bytes to hash
 * @returns Double SHA-256 hash of the formatted message
 */
async function createMessageHash(messageBytes: Uint8Array) {
  const prefix = 'Bitcoin Signed Message:\n'
  const prefixBytes = encoder.encode(prefix)

  // Encode lengths using Bitcoin's varint format
  const prefixLength = encodeVarint(prefixBytes.length)
  const messageLength = encodeVarint(messageBytes.length)

  // Build complete message: varint(prefix_len) + prefix + varint(msg_len) + message
  const fullMessage = new Uint8Array(
    prefixLength.length + prefixBytes.length + messageLength.length + messageBytes.length
  )

  // Concatenate all parts in order
  let offset = 0
  fullMessage.set(prefixLength, offset)
  offset += prefixLength.length
  fullMessage.set(prefixBytes, offset)
  offset += prefixBytes.length
  fullMessage.set(messageLength, offset)
  offset += messageLength.length
  fullMessage.set(messageBytes, offset)

  // Apply double SHA-256 hash (standard for Bitcoin)
  const hashBuffer = await doubleSha256(fullMessage.buffer)
  return new Uint8Array(hashBuffer)
}

/**
 * Convert secp256k1 public key point to Bitcoin address
 * Supports both compressed and uncompressed public key formats
 *
 * @param publicKey Elliptic curve point representing the public key
 * @param compressed Whether to use compressed format (33 bytes vs 65 bytes)
 * @returns Bitcoin address string in Base58Check format
 */
async function publicKeyToAddress(publicKey: Point, compressed: boolean = true) {
  let publicKeyBytes: Uint8Array

  if (compressed) {
    // Compressed format: 33 bytes total
    // First byte: 0x02 (even y) or 0x03 (odd y)
    // Next 32 bytes: x coordinate
    publicKeyBytes = new Uint8Array(33)
    publicKeyBytes[0] = publicKey.y % 2n === 0n ? 0x02 : 0x03

    // Convert x coordinate to 32-byte big-endian representation
    const xBytes = publicKey.x.toString(16).padStart(64, '0')
    for (let i = 0; i < 32; i++) {
      publicKeyBytes[i + 1] = parseInt(xBytes.substring(i * 2, i * 2 + 2), 16)
    }
  } else {
    // Uncompressed format: 65 bytes total
    // First byte: 0x04 (uncompressed marker)
    // Next 32 bytes: x coordinate
    // Last 32 bytes: y coordinate
    publicKeyBytes = new Uint8Array(65)
    publicKeyBytes[0] = 0x04

    // Convert x coordinate to 32-byte big-endian representation
    const xBytes = publicKey.x.toString(16).padStart(64, '0')
    for (let i = 0; i < 32; i++) {
      publicKeyBytes[i + 1] = parseInt(xBytes.substring(i * 2, i * 2 + 2), 16)
    }

    // Convert y coordinate to 32-byte big-endian representation
    const yBytes = publicKey.y.toString(16).padStart(64, '0')
    for (let i = 0; i < 32; i++) {
      publicKeyBytes[i + 33] = parseInt(yBytes.substring(i * 2, i * 2 + 2), 16)
    }
  }

  // Create Bitcoin address using standard process:
  // 1. SHA-256 hash of public key
  const sha256Hash = await sha256(publicKeyBytes.buffer as ArrayBuffer)
  // 2. RIPEMD-160 hash of the SHA-256 hash
  const ripemd160Hash = ripemd160(new Uint8Array(sha256Hash))

  // 3. Add version byte (0x00 for mainnet Pay-to-Public-Key-Hash)
  const versioned = new Uint8Array(21)
  versioned[0] = 0x00 // Mainnet P2PKH version
  versioned.set(ripemd160Hash.slice(0, 20), 1)

  // 4. Calculate checksum (first 4 bytes of double SHA-256 of versioned hash)
  const checksumBuffer = await doubleSha256(versioned.buffer)
  const checksum = new Uint8Array(checksumBuffer)

  // 5. Combine version + hash + checksum (25 bytes total)
  const fullAddress = new Uint8Array(25)
  fullAddress.set(versioned, 0)
  fullAddress.set(checksum.slice(0, 4), 21)

  // 6. Encode as Base58 to create final address string
  return base58Encode(fullAddress)
}

/**
 * Encode byte array as Base58 string (Bitcoin's address encoding)
 * Base58 uses digits and letters but excludes 0, O, I, l to avoid confusion
 *
 * @param bytes Byte array to encode
 * @returns Base58-encoded string
 */
function base58Encode(bytes: Uint8Array): string {
  const alphabet = BASE58_ALPHABET
  const base = BigInt(alphabet.length)

  // Convert byte array to a single large integer
  let num = 0n
  for (let i = 0; i < bytes.length; i++) {
    num = num * 256n + BigInt(bytes[i])
  }

  // Convert to base58 by repeatedly dividing by 58
  let result = ''
  while (num > 0n) {
    const remainder = num % base
    result = alphabet[Number(remainder)] + result
    num = num / base
  }

  // Preserve leading zero bytes as '1' characters (Base58 convention)
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    result = '1' + result
  }

  return result
}
