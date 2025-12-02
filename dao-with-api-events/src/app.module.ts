import { Module } from '@nestjs/common';
import { ProposalsController } from './proposals/proposals.controller';
import { ProposalsService } from './proposals/proposals.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [ProposalsController],
  providers: [ProposalsService],
})
export class AppModule {}
