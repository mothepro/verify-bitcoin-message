# Bitcoin Signature Verifier

A dependency-free Bitcoin message signature verifier that works in browsers without requiring npm install.

## Features

- **Zero Dependencies**: Pure TypeScript implementation with no external dependencies
- **Browser Compatible**: Works directly in modern browsers using ES modules
- **Client-Side Verification**: Verifies signatures entirely in the browser
- **Simple API**: Clean TypeScript interface for programmatic use
- **Unit Tests**: Includes a test suite for the verification logic

## Prerequisites

- **Modern Browser**:

## Things you can do

### Clone the repository

   Bun: download from [https://bun.sh](https://bun.sh)

   ```bash
   git clone https://github.com/mothepro/verify-bitcoin-message
   cd verify-bitcoin-message
   bun install
   bun test
   ```

### Serve locally

   Requires ES modules and Web Crypto API support

   ```bash
   bun run build:browser
   python -m http.server 8000
   ```

### Offline

You can test offline mode in Chrome (webkit browsers) by opening Developer Tools (F12)

- Network
- Change "No Throttling" -> "Offline"

## Usage

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

- tiny-secp256k1: <https://github.com/bitcoinjs/tiny-secp256k1>
- crypto-js: <https://github.com/brix/crypto-js>

### Alternatives

<https://www.bitcoin.com/tools/verify-message/>
<https://www.verifybitcoinmessage.com/>
