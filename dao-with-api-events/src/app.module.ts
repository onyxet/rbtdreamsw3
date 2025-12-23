import { Module } from '@nestjs/common';
import { ProposalsController } from './proposals/proposals.controller';
import { ProposalsService } from './proposals/proposals.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [ProposalsController, AuthController],
  providers: [ProposalsService, AuthService],
})
export class AppModule {}
