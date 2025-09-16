export interface Payload {
  message: string
  address: string
  signature: string
}

export default function verify({message, address, signature}: Payload) {

}

export function verifySafe(params: Payload) {
  try {
    verify(params)
    return true
  } finally {
    return false
  }
}
