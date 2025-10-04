import verify, { assert, parsePayload } from '../verify'

// UI Elements
const form = document.getElementById('verifyForm') as HTMLFormElement
const heroDiv = document.getElementById('hero')!
const verifiedDisplay = document.getElementById('verified-display')!
const errorDisplay = document.getElementById('error-display')!
const errorReason = document.getElementById('error-reason')!
const verifiedAddressLink = document.getElementById('verified-address-link') as HTMLAnchorElement
const verifiedMessageContent = document.getElementById('verified-message-content')!
const verifyDialog = document.getElementById('verify-dialog') as HTMLDialogElement
const addressInput = document.getElementById('address') as HTMLInputElement
const messageInput = document.getElementById('message') as HTMLTextAreaElement
const signatureInput = document.getElementById('signature') as HTMLInputElement
const blueWalletLink = document.getElementById('blue-wallet-link') as HTMLAnchorElement
const isHexInput = document.getElementById('isHex') as HTMLInputElement
const hexContainer = document.getElementById('hex-checkbox-container')!
const jsonStringify = document.getElementById('json-stringify') as HTMLPreElement

// Set URL params to the UI Elements
const params = new URLSearchParams(location.search)
addressInput.value = params.get('address')?.trim() ?? ''
messageInput.value = params.get('message')?.trim() ?? ''
signatureInput.value = params.get('signature')?.trim() ?? ''
isHexInput.checked = params.get('isHex')?.trim() === 'on'

const payload = {
  address: addressInput.value.trim(),
  message: messageInput.value.trim(),
  signature: signatureInput.value.trim(),
}

jsonStringify.textContent = JSON.stringify(payload, null, 2)

if (signatureInput.value) verifySignature()
showHero()
form.addEventListener('submit', handleSubmit)

async function verifySignature() {
  const {
    address,
    signature,
    message: { bytes, utf8 },
  } = parsePayload(payload)
  const isHex = isHexInput.checked

  try {
    const isValid = await verify({ message: bytes, address, signature })
    assert(isValid, 'Signature is invalid')
    showVerifiedMessage(address, utf8)
  } catch (error: unknown) {
    showError(error instanceof Error ? error : Error(String(error)))
  } finally {
    verifyDialog.close()

    // Update the URL with the current values
    const url = new URL(location.href)
    url.searchParams.set('address', address)
    url.searchParams.set('message', utf8)
    url.searchParams.set('signature', signature)
    if (isHex) url.searchParams.set('isHex', 'on')
    history.pushState('', '@mothepro', url.toString())

    // Update BlueWallet link
    const blueUrl = new URL(blueWalletLink.href)
    blueUrl.searchParams.set('a', address)
    blueUrl.searchParams.set('m', utf8)
    blueUrl.searchParams.set('s', signature)
    blueWalletLink.href = blueUrl.toString()
  }
}

/// These are the functions that update the UI

function showHero() {
  heroDiv.classList.remove('hidden')
  verifiedDisplay.classList.add('hidden')
  errorDisplay.classList.add('hidden')
}

function showVerifiedMessage(address: string, message: string) {
  heroDiv.classList.add('hidden')
  verifiedDisplay.classList.remove('hidden')
  errorDisplay.classList.add('hidden')

  // Set up the address link
  verifiedAddressLink.textContent = escapeHtml(address)
  verifiedAddressLink.href = `https://mempool.space/address/${escapeHtml(address)}`

  // Display the message with proper formatting
  verifiedMessageContent.innerHTML = `<pre style="background:none">${escapeHtml(message)}</pre>`
}

function showError({ message }: Error) {
  heroDiv.classList.add('hidden')
  verifiedDisplay.classList.add('hidden')
  errorDisplay.classList.remove('hidden')
  errorReason.textContent = message
}

function handleSubmit(e: SubmitEvent) {
  e.preventDefault()
  verifySignature()
  return false
}

function escapeHtml(text: string): string {
  tempDiv.textContent = text
  return tempDiv.innerHTML
}
const tempDiv = document.createElement('div')

globalThis.openVerifyDialog = () => verifyDialog.showModal()
globalThis.closeVerifyDialog = () => verifyDialog.close()
declare global {
  // for onclick handlers
  function openVerifyDialog(): void
  function closeVerifyDialog(): void
}

// Remove this vvvvvvvvvvv ?

// Smart hex detection
function isLikelyHex(text: string): boolean {
  if (!text) return false

  // Check if starts with 0x
  if (text.startsWith('0x')) return true

  // Check if only contains hex characters (0-9, a-f, A-F)
  const hexPattern = /^[0-9a-fA-F]+$/
  return hexPattern.test(text) && text.length > 8 // Only suggest hex for longer strings
}

function updateHexCheckboxVisibility() {
  const message = messageInput.value.trim()
  if (isLikelyHex(message)) {
    hexContainer.style.display = 'block'
    isHexInput.checked = true
  } else {
    hexContainer.style.display = 'none'
    isHexInput.checked = false
  }
}

// Add event listener for message input
messageInput.addEventListener('input', updateHexCheckboxVisibility)
updateHexCheckboxVisibility()
