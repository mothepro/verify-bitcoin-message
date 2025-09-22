import { fail, type Payload } from '.';

const defaultLocalConnection = {
  url: "http://127.0.0.1:8332/",
  user: "bitcoinuser",
  password: "bitcoinpassword",
}

export async function verify({ address, signature, message }: Payload, { url, user, password } = defaultLocalConnection) {
  const body = JSON.stringify({
    jsonrpc: "1.0",
    id: "curltest",
    method: "verifymessage",
    params: [address, signature, message],
  });
  const response = await fetch(url, {
    body,
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      "Authorization": "Basic " + btoa(`${user}:${password}`),
    },
  });

  const { result, error } = await response.json();
  return result ?? fail(error)
}


export default async function verifySafe(params: Payload, connection?: typeof defaultLocalConnection): Promise<boolean> {
  try {
    return await verify(params, connection)
  } catch (error) {
    return false
  }
}
