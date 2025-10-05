import validPayloads from '../tests/valid-payloads.json'
import verify, { assert, parsePayload } from '../verify'

const form = document.getElementById('verifyForm') as HTMLFormElement
const heroDiv = document.getElementById('hero') as HTMLDivElement
const verifiedDisplay = document.getElementById('verified-display') as HTMLDivElement
const errorDisplay = document.getElementById('error-display') as HTMLDivElement
const errorReason = document.getElementById('error-reason') as HTMLDivElement
const verifiedAddressLink = document.getElementById('verified-address-link') as HTMLAnchorElement
const verifiedMessageContent = document.getElementById('verified-message-content') as HTMLPreElement
const verifyDialog = document.getElementById('verify-dialog') as HTMLDialogElement
const addressInput = document.getElementById('address') as HTMLInputElement
const messageInput = document.getElementById('message') as HTMLTextAreaElement
const signatureInput = document.getElementById('signature') as HTMLInputElement
const blueWalletLink = document.getElementById('blue-wallet-link') as HTMLAnchorElement
const isHexInput = document.getElementById('isHex') as HTMLInputElement
const jsonStringifyPre = document.getElementById('json-stringify') as HTMLPreElement
const validPayloadsList = document.getElementById('valid-payloads') as HTMLOListElement

form.addEventListener('submit', handleSubmit)

// Set URL params to the UI Elements
const params = new URLSearchParams(location.search)
addressInput.value = params.get('address')?.trim() ?? ''
messageInput.value = params.get('message')?.trim() ?? ''
signatureInput.value = params.get('signature')?.trim() ?? ''
switch (params.get('isHex')?.trim()) {
  case '':
  case 'yes':
  case 'on':
  case 'true':
    isHexInput.checked = true
    break

  case 'no':
  case 'off':
  case 'false':
    isHexInput.checked = false
    break
}

if (signatureInput.value) verifySignature()

heroDiv.classList.remove('hidden')
async function verifySignature() {
  let messageParam = messageInput.value.trim()
  if (isHexInput.checked && !messageParam.startsWith('0x')) messageParam = '0x' + messageParam

  const {
    address,
    signature,
    message: { bytes, utf8, isHexStr },
  } = parsePayload({
    message: messageParam,
    address: addressInput.value.trim(),
    signature: signatureInput.value.trim(),
  })

  verifiedDisplay.classList.add('hidden')
  errorDisplay.classList.add('hidden')

  try {
    const isValid = await verify({ message: bytes, address, signature })
    assert(isValid, 'Signature is invalid')

    verifiedAddressLink.textContent = address
    verifiedAddressLink.href = `https://mempool.space/address/${address}`
    verifiedMessageContent.textContent = utf8
    verifiedDisplay.classList.remove('hidden')
    errorDisplay.classList.add('hidden')
  } catch (error: unknown) {
    errorReason.textContent = error instanceof Error ? error.message : String(error)
    verifiedDisplay.classList.add('hidden')
    errorDisplay.classList.remove('hidden')
  } finally {
    verifyDialog.close()
    heroDiv.classList.add('hidden')
    jsonStringifyPre.textContent = JSON.stringify({ address, signature, message: utf8 }, null, 2)

    // Update BlueWallet link
    const blueUrl = new URL(blueWalletLink.href)
    blueUrl.searchParams.set('a', address)
    blueUrl.searchParams.set('m', utf8)
    blueUrl.searchParams.set('s', signature)
    blueWalletLink.href = blueUrl.toString()

    // Update the URL with the current values
    const url = new URL(location.href)
    url.searchParams.set('address', address)
    url.searchParams.set('message', utf8)
    url.searchParams.set('signature', signature)
    if (isHexStr) url.searchParams.set('isHex', 'on')

    history.pushState('', '@mothepro', url.toString())
  }
}

/// These are the functions that update the UI

function handleSubmit(e: SubmitEvent) {
  e.preventDefault()
  verifySignature()
  return false
}
for (const { address, message, signature } of validPayloads) {
  const url = new URL(location.href)
  url.searchParams.set('address', address)
  url.searchParams.set('message', message)
  url.searchParams.set('signature', signature)

  const anchor = document.createElement('a')
  anchor.textContent = message
  anchor.target = '_blank'
  anchor.rel = 'noopener noreferrer'
  anchor.href = url.toString()

  const li = document.createElement('li')
  li.appendChild(anchor)
  validPayloadsList.appendChild(li)
}

globalThis.openVerifyDialog = () => verifyDialog.showModal()
globalThis.closeVerifyDialog = () => verifyDialog.close()
declare global {
  // for onclick handlers
  function openVerifyDialog(): void
  function closeVerifyDialog(): void
}
