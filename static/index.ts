import verify, { assert, strToMessage } from '../verify'

// Get URL params
const params = new URLSearchParams(location.search)
const defaultAddress = params.get('address') ?? ''
const defaultMessage = params.get('message') ?? ''
const defaultSignature = params.get('signature') ?? ''
const isHex = params.get('isHex') ?? 'off'

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

// Set URL params to the UI Elements
addressInput.value = defaultAddress
messageInput.value = defaultMessage
signatureInput.value = defaultSignature
isHexInput.checked = isHex === 'on'

// Add event listener for message input
messageInput.addEventListener('input', updateHexCheckboxVisibility)
updateHexCheckboxVisibility()

// Auto verify if all fields are filled
if (defaultAddress && defaultMessage && defaultSignature) verifySignature()
else showHero()

globalThis.openVerifyDialog = () => verifyDialog.showModal()
globalThis.closeVerifyDialog = () => verifyDialog.close()
form.addEventListener('submit', handleSubmit)

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
  verifiedAddressLink.textContent = address
  verifiedAddressLink.href = `https://mempool.space/address/${address}`

  // Display the message with proper formatting
  verifiedMessageContent.innerHTML = `<pre style="background:none">${escapeHtml(message)}</pre>`
}

function showError({ message }: Error) {
  heroDiv.classList.add('hidden')
  verifiedDisplay.classList.add('hidden')
  errorDisplay.classList.remove('hidden')
  errorReason.textContent = message
}

const tempDiv = document.createElement('div')
function escapeHtml(text: string): string {
  tempDiv.textContent = text
  return tempDiv.innerHTML
}

async function verifySignature() {
  const address = addressInput.value.trim()
  const messageUTF8 = messageInput.value.trim()
  const signature = signatureInput.value.trim()
  const isHex = isHexInput.checked

  try {
    const message = strToMessage(messageUTF8, isHex)
    const isValid = await verify({ message, address, signature })
    assert(isValid, 'Signature is invalid')
    showVerifiedMessage(address, messageUTF8)
  } catch (error: unknown) {
    showError(error instanceof Error ? error : Error(String(error)))
  } finally {
    verifyDialog.close()

    // Update the URL with the current values
    const url = new URL(location.href)
    url.searchParams.set('address', address)
    url.searchParams.set('message', messageUTF8)
    url.searchParams.set('signature', signature)
    if (isHex) url.searchParams.set('isHex', 'on')
    history.pushState('', '@mothepro', url.toString())

    // Update BlueWallet link
    const blueUrl = new URL(blueWalletLink.href)
    blueUrl.searchParams.set('a', address)
    blueUrl.searchParams.set('m', messageUTF8)
    blueUrl.searchParams.set('s', signature)
    blueWalletLink.href = blueUrl.toString()
  }
}

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

function handleSubmit(e: SubmitEvent) {
  e.preventDefault()
  verifySignature()
  return false
}

// Global functions for onclick handlers
declare global {
  function openVerifyDialog(): void
  function closeVerifyDialog(): void
}
