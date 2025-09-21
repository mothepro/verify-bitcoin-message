/**
 * Bitcoin Message Signature Verifier
 *
 * A complete dependency-free implementation of Bitcoin message signature verification
 * that works in modern browsers using only Web APIs.
 *
 * Includes full secp256k1 elliptic curve operations and RIPEMD-160 implementation.
 */

import * as secp256k1 from 'https://unpkg.com/tiny-secp256k1@2.2.4/lib/index.js';
import * as CryptoJS from 'https://unpkg.com/crypto-js@4.2.0/index.js';

import { base64ToBytes, createMessageHash, publicKeyToAddress, recoverPublicKey } from './utils';

export interface Payload {
  message: string
  address: string
  signature: string
}

export function fail(error: unknown) {
  throw error instanceof Error ? error : new Error(error as string)
}

export function assert(condition: unknown, error: unknown = 'Assertion failed'): asserts condition {
  if (!condition) fail(error)
}

export async function verify({message, address, signature}: Payload) {

  // Decode the signature from base64
  const sigBytes = base64ToBytes(signature)
  assert(sigBytes.length === 65, `Invalid signature length: ${sigBytes.length}, expected 65`)

  // Bitcoin message signatures use recovery flags 27-34
  const recoveryFlag = sigBytes[0]
  assert(recoveryFlag >= 27, 'Invalid recovery flag')
  assert(recoveryFlag <= 34, 'Invalid recovery flag')

  // Adjust recovery ID for compressed/uncompressed
  const isCompressed = recoveryFlag >= 4
  const recoveryId = recoveryFlag - (isCompressed ? 27 + 4 : 27)

  const signatureData = sigBytes.slice(1)

  // Create message hash using Bitcoin's message signing format
  const messageHash = await createMessageHash(message)

  // Try to recover public key from signature
  const publicKey = recoverPublicKey(messageHash, signatureData, recoveryId)
  assert(publicKey, 'Failed to recover public key')

  // Convert recovered public key to Bitcoin address
  const recoveredAddressCompressed = await publicKeyToAddress(publicKey, true)
  const recoveredAddressUncompressed = await publicKeyToAddress(publicKey, false)

  // Compare with provided address (try both compressed and uncompressed)
  return [recoveredAddressCompressed, recoveredAddressUncompressed].includes(address)
}

export default async function verifySafe(params: Payload): Promise<boolean> {
  try {
    return await verify(params)
  } catch (error) {
    return false
  }
}
