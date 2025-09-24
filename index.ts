/**
 * Bitcoin Message Signature Verifier
 *
 * A complete dependency-free implementation of Bitcoin message signature verification
 * that works in modern browsers using only Web APIs.
 */


import { base64ToBytes, createMessageHash, publicKeyToAddress, recoverPublicKey } from './cryptography';

export interface Payload {
  message: string
  address: string
  signature: string
}

export function fail(error: unknown): never {
  throw error instanceof Error ? error : new Error(error as string)
}

export function assert(condition: unknown, error: unknown = 'Assertion failed'): asserts condition {
  if (!condition) fail(error)
}

export default async function verify({message, address, signature}: Payload) {
  // Decode the signature from base64
  const sigBytes = base64ToBytes(signature)
  assert(sigBytes.length === 65, `Invalid signature length: ${sigBytes.length}, expected 65`)

  // Bitcoin message signatures use recovery flags 27-34
  const recoveryFlag = sigBytes[0]
  assert(recoveryFlag >= 27, 'Invalid recovery flag')
  assert(recoveryFlag <= 34, 'Invalid recovery flag')

  // Extract signature data (skip recovery flag)
  const signatureData = sigBytes.slice(1)

  // Create message hash using Bitcoin's message signing format
  const messageHash = await createMessageHash(message)

  // Try all recovery IDs and both compressed/uncompressed formats
  for (let testRecoveryId = 0; testRecoveryId < 4; testRecoveryId++) {
    const publicKey = recoverPublicKey(messageHash, signatureData, testRecoveryId)
    if (publicKey) {
      for (const compressed of [true, false]) {
        const testAddress = await publicKeyToAddress(publicKey, compressed)
        if (testAddress === address) {
          return true
        }
      }
    }
  }

  fail('Unable to recover public key from signature')
}

export async function verifySafe(params: Payload, log = true) {
  try {
    return await verify(params)
  } catch (error) {
    if (log) console.error(error)
    return false
  }
}
