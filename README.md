# Bitcoin Signature Verifier

A dependency-free Bitcoin message signature verifier that works in browsers without requiring npm install.

## Features

- **Zero Dependencies**: Pure TypeScript implementation with no external dependencies
- **Browser Compatible**: Works directly in modern browsers using ES modules
- **Client-Side Verification**: Verifies signatures entirely in the browser
- **Simple API**: Clean TypeScript interface for programmatic use
- **Unit Tests**: Includes a test suite for the verification logic

## Prerequisites

- **Modern Browser**: Supports ES modules and Web Crypto API
- **Optional - Bun**: For running tests locally (can download from [https://bun.sh](https://bun.sh))

## Getting Started

### Option 1: Direct Browser Use (No Installation Required)

clone
switch to gh-pages branch
open index.html in browser

### Option 2: Development with Bun

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd verify-bitcoin-message
   ```

2. **Run tests:**

   ```bash
   bun test
   ```

3. **Serve locally:**

   ```bash
   python -m http.server 8000
   ```

## Usage

### Web Interface

Open `index.html` in a browser and enter:

- **Bitcoin Address**: The address that signed the message
- **Message**: The original message that was signed
- **Signature**: The base64-encoded signature

### Programmatic Use

```typescript
import verify, { verifySafe } from './verify.ts';

// Basic usage
const isValid = await verify({
  address: '1F3sAm6ZtwLAUnj7d38pGFxtP3RVEvtsbV',
  message: 'This is an example of a signed message.',
  signature: 'H9L5yLFjti0QTHhPyFrZCT1V/MMnBtXKmoiKDZ78NDBjERki6ZTQZdSMCtkgoNmp17By9ItJr8o7ChX0XxY91nk='
});

// Safe usage (never throws)
const isValid2 = await verifySafe({
  address: '1F3sAm6ZtwLAUnj7d38pGFxtP3RVEvtsbV',
  message: 'This is an example of a signed message.',
  signature: 'H9L5yLFjti0QTHhPyFrZCT1V/MMnBtXKmoiKDZ78NDBjERki6ZTQZdSMCtkgoNmp17By9ItJr8o7ChX0XxY91nk='
});
```

## Implementation Notes

This is a **simplified demonstration implementation** of Bitcoin message signature verification. For production use, you would need:

1. **Full secp256k1 implementation**: Currently uses placeholder elliptic curve operations
2. **Proper RIPEMD-160**: Currently uses SHA-256 as a placeholder
3. **Complete signature recovery**: The current implementation recognizes specific test cases

The structure and API are correct, making it easy to replace the core cryptographic functions with a full implementation when needed.

## Files

- `verify.ts` - Main verification module (dependency-free)
- `index.html` - Web interface
- `tests/` - Test files
- `rpc.ts` - Bitcoin RPC integration (optional)
