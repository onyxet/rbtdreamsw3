import { Module } from '@nestjs/common';
import { ProposalController } from './proposal.controller';
import { ProposalService } from './proposal.service';
import { ProposalStorageService } from './proposal-storage.service';
import { EventListenerService } from './event-listener.service';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [BlockchainModule],
  controllers: [ProposalController],
  providers: [
    ProposalService,
    ProposalStorageService,
    EventListenerService,
  ],
})
export class ProposalModule {}
