export interface NonceResponse {
  nonce: string;
}

export interface VerifyRequest {
  address: string;
  signature: string;
}

export interface VerifyResponse {
  message: string;
}
