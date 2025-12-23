import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  BadRequestException,
  UnauthorizedException,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { NonceResponse, VerifyRequest } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('nonce')
  getNonce(@Query('address') address?: string): NonceResponse {
    if (!address) {
      throw new BadRequestException('Missing address');
    }

    const nonce = this.authService.generateNonce(address);
    return { nonce };
  }

  @Post('verify')
  @HttpCode(200)
  verifySignature(@Body() body: VerifyRequest): { message: string } {
    const { address, signature } = body;

    if (!address || !signature) {
      throw new BadRequestException('Missing params');
    }

    try {
      const isValid = this.authService.verifySignature(address, signature);

      if (!isValid) {
        throw new UnauthorizedException('Invalid signature');
      }

      return { message: 'Authentication successful' };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid signature');
    }
  }
}
