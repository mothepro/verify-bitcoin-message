import verify, { assert, strToMessage } from '../verify'

const params = new URLSearchParams(location.search)
const defaultAddress = params.get('address') ?? ''
const defaultMessage = params.get('message') ?? ''
const defaultSignature = params.get('signature') ?? ''
const isHex = params.get('isHex') ?? 'off'

const addressInput = document.getElementById('address') as HTMLInputElement
const messageInput = document.getElementById('message') as HTMLTextAreaElement
const signatureInput = document.getElementById('signature') as HTMLInputElement
const resultDiv = document.getElementById('result')!
const moreInfoContainer = document.getElementById('more-info-container')!
const moreInfoDiv = document.getElementById('more-info')!
const mempoolLink = document.getElementById('mempoolLink') as HTMLAnchorElement
const blueWalletLink = document.getElementById('blue-wallet-link') as HTMLAnchorElement
const isHexInput = document.getElementById('isHex') as HTMLInputElement

// Set default values
addressInput.value = defaultAddress
messageInput.value = defaultMessage
signatureInput.value = defaultSignature
isHexInput.checked = isHex === 'on'

if (defaultAddress) {
  mempoolLink.classList.remove('hidden')
  mempoolLink.href = `https://mempool.space/address/${defaultAddress}`
}

// Auto verify if all fields are filled
if (defaultAddress && defaultMessage && defaultSignature) verifySignature()

async function verifySignature() {
  const address = addressInput.value.trim()
  const messageStr = messageInput.value.trim()
  const signature = signatureInput.value.trim()
  const isHex = isHexInput.checked

  const blueUrl = new URL(blueWalletLink.href)
  blueUrl.searchParams.set('a', address)
  blueUrl.searchParams.set('m', messageStr)
  blueUrl.searchParams.set('s', signature)
  blueWalletLink.href = blueUrl.toString()

  // Clear previous result
  moreInfoContainer.classList.add('hidden')
  resultDiv.textContent = 'Verifying...'
  resultDiv.className = ''

  try {
    const message = strToMessage(messageStr, isHex)
    const isValid = await verify({ message, address, signature })
    assert(isValid, 'Signature is invalid')
    resultDiv.textContent = '✅ Signature is valid!'
    resultDiv.className = 'success'
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    resultDiv.textContent = '❌ Signature is invalid.'
    resultDiv.className = 'error'
    moreInfoDiv.textContent = errorMessage
    moreInfoContainer.classList.remove('hidden')
  }
}
