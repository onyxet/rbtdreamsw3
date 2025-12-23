import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ethers } from 'ethers';

@Injectable()
export class AuthService {
  private readonly nonceCache = new Map<string, string>();

  generateNonce(address: string): string {
    const lowerAddress = address.toLowerCase();
    const nonce = randomUUID();
    this.nonceCache.set(lowerAddress, nonce);
    return nonce;
  }

  verifySignature(address: string, signature: string): boolean {
    const lowerAddress = address.toLowerCase();
    const expectedNonce = this.nonceCache.get(lowerAddress);

    if (!expectedNonce) {
      throw new Error('Nonce not found');
    }

    try {
      const recovered = ethers.verifyMessage(expectedNonce, signature);

      if (recovered.toLowerCase() !== lowerAddress) {
        return false;
      }

      // Remove nonce after successful verification
      this.nonceCache.delete(lowerAddress);
      return true;
    } catch (error) {
      return false;
    }
  }
}
