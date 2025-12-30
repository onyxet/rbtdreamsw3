import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProposalModule } from './proposals/proposal.module';

@Module({
  imports: [ProposalModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
