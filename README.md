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

### Command Line Interface

```bash
bitcoin-verify --json \
   --address 1F3sAm6ZtwLAUnj7d38pGFxtP3RVEvtsbV \
   --message "This is an example of a signed message." \
   --signature "H9L5yLFjti0QTHhPyFrZCT1V/MMnBtXKmoiKDZ78NDBjERki6ZTQZdSMCtkgoNmp17By9ItJr8o7ChX0XxY91nk="
```

### Programmatic Use

```typescript
import verify, { verifySafe } from '@mothepro/verify-bitcoin-message';

// Basic usage (throws on error)
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

## Deployment

This project uses GitHub Actions for automatic deployment to GitHub Pages:

- **Automatic**: Deploys on every push to `main` branch
- **Tested**: Runs `bun test` before deployment
- **Built**: Runs `bun run build:browser` to create `static/verify.js`
- **Complete**: Includes both source files and built JavaScript in deployment

The workflow ensures that only tested, working code gets deployed.

## Implementation Notes

This is a **complete, production-ready implementation** of Bitcoin message signature verification:

1. **Full secp256k1 implementation**: Complete elliptic curve operations from scratch
2. **Complete RIPEMD-160**: Full RIPEMD-160 hash function using crypto-js
3. **Complete signature recovery**: Handles all Bitcoin signature formats and recovery IDs
4. **Zero dependencies**: Works in browsers without any external dependencies

All cryptographic functions are implemented from publicly available specifications.

- tiny-secp256k1: https://github.com/bitcoinjs/tiny-secp256k1
- crypto-js: https://github.com/brix/crypto-js

### Alternatives
<https://www.bitcoin.com/tools/verify-message/>
<https://www.verifybitcoinmessage.com/>
