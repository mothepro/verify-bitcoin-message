# Bitcoin Signature Verifier

A simple single-page application built with Bun and TypeScript to verify Bitcoin message signatures.

## Features

- **Client-Side Verification**: Verifies signatures directly in the browser using the `bitcoinjs-message` library.
- **RESTful API**: Includes a server-side route `/v1/verify` for programmatically verifying signatures.
- **Unit Tests**: Includes a test suite for the verification logic.

## Prerequisites

- **Bun**: Ensure you have Bun installed. You can download it from [https://bun.sh](https://bun.sh).
- **Bitcoin RPC Node**: For running tests, you need a local or remote Bitcoin RPC node with the `signmessagewithprivkey` and `verifymessage` commands enabled.

## Getting Started

1. **Clone the repository:**

    ```bash
    git clone ...
    ```

2. **Install dependencies:**

    ```bash
    bun install
    ```

3. **Run the application locally:**
    Bun serves the `index.html` file and handles the TypeScript compilation on the fly.

    ```bash
    bun start
    ```

    The application will be available at `http://localhost:3000`.

4. **Run the unit tests:**
    Before running tests, ensure your Bitcoin RPC node is running and accessible. The test suite uses the `BITCOIN_RPC_URL` environment variable.

    ```bash
    BITCOIN_RPC_URL="[http://user:password@127.0.0.1:8332](http://user:password@127.0.0.1:8332)" bun test
    ```

## API Endpoint

The application also exposes a simple REST API endpoint for signature verification.

**`GET /v1/verify`**

| Query Parameter | Type   | Required | Description                                    |
| --------------- | ------ | -------- | ---------------------------------------------- |
| `address`       | string | Yes      | The Bitcoin address that signed the message.   |
| `message`       | string | Yes      | The original message.                          |
| `signature`     | string | Yes      | The signature to verify.                       |
| `mode`          | string | No       | The encoding of the message (`utf-8` or `hex`).|
