import { Injectable, OnModuleInit } from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ProposalStorageService } from './proposal-storage.service';
import { ProposalData, VoteData, ProposalEvent } from './proposal.interface';

@Injectable()
export class EventListenerService implements OnModuleInit {
  private isPolling = false;

  constructor(
    private blockchainService: BlockchainService,
    private storageService: ProposalStorageService,
  ) {}

  async onModuleInit() {
    console.log('Initializing event listener...');
    await this.startPolling();
  }

  private async startPolling() {
    if (this.isPolling) return;
    this.isPolling = true;

    const pollInterval = this.blockchainService.getPollInterval();
    console.log(`Starting event polling with ${pollInterval}ms interval`);

    setInterval(async () => {
      await this.pollEvents();
    }, pollInterval);

    // Initial poll
    await this.pollEvents();
  }

  private async pollEvents() {
    try {
      const contract = this.blockchainService.getContract();
      const provider = this.blockchainService.getProvider();
      const currentBlock = await provider.getBlockNumber();

      let fromBlock = this.storageService.getLastProcessedBlock();
      if (fromBlock === 0) {
        fromBlock = this.blockchainService.getStartBlock();
      }

      if (fromBlock >= currentBlock) {
        return;
      }
      console.log(`Polling events from block ${fromBlock} to ${currentBlock}`);
      await this.processProposalCreatedEvents(contract, fromBlock, currentBlock);
      await this.processProposalCanceledEvents(contract, fromBlock, currentBlock);
      await this.processProposalQueuedEvents(contract, fromBlock, currentBlock);
      await this.processProposalExecutedEvents(contract, fromBlock, currentBlock);
      await this.processVoteCastEvents(contract, fromBlock, currentBlock);

      this.storageService.setLastProcessedBlock(currentBlock);
    } catch (error) {
      console.error('Error polling events:', error);
    }
  }

  private async processProposalCreatedEvents(
    contract: any,
    fromBlock: number,
    toBlock: number,
  ) {
    const filter = contract.filters.ProposalCreated();
    const events = await contract.queryFilter(filter, fromBlock, toBlock);

    for (const event of events) {
      const args = event.args;
      const block = await event.getBlock();

      const proposal: ProposalData = {
        proposalId: args.proposalId.toString(),
        proposer: args.proposer,
        targets: Array.from(args.targets),
        values: Array.from(args.values).map((v: any) => v.toString()),
        signatures: Array.from(args.signatures),
        calldatas: Array.from(args.calldatas),
        voteStart: args.voteStart.toString(),
        voteEnd: args.voteEnd.toString(),
        description: args.description,
        createdAtBlock: event.blockNumber,
        createdAtTimestamp: Number(block.timestamp),
      };

      this.storageService.storeProposal(proposal);

      const eventData: ProposalEvent = {
        type: 'ProposalCreated',
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: Number(block.timestamp),
        data: proposal,
      };

      this.storageService.storeEvent(eventData);
    }
  }

  private async processProposalCanceledEvents(
    contract: any,
    fromBlock: number,
    toBlock: number,
  ) {
    const filter = contract.filters.ProposalCanceled();
    const events = await contract.queryFilter(filter, fromBlock, toBlock);

    for (const event of events) {
      const args = event.args;
      const block = await event.getBlock();
      const proposalId = args.proposalId.toString();

      const eventData: ProposalEvent = {
        type: 'ProposalCanceled',
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: Number(block.timestamp),
        data: { proposalId },
      };

      this.storageService.storeEvent(eventData);
    }
  }

  private async processProposalQueuedEvents(
    contract: any,
    fromBlock: number,
    toBlock: number,
  ) {
    const filter = contract.filters.ProposalQueued();
    const events = await contract.queryFilter(filter, fromBlock, toBlock);

    for (const event of events) {
      const args = event.args;
      const block = await event.getBlock();
      const proposalId = args.proposalId.toString();
      const etaSeconds = args.etaSeconds.toString();

      this.storageService.updateProposal(proposalId, { etaSeconds });

      const eventData: ProposalEvent = {
        type: 'ProposalQueued',
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: Number(block.timestamp),
        data: { proposalId, etaSeconds },
      };

      this.storageService.storeEvent(eventData);
    }
  }

  private async processProposalExecutedEvents(
    contract: any,
    fromBlock: number,
    toBlock: number,
  ) {
    const filter = contract.filters.ProposalExecuted();
    const events = await contract.queryFilter(filter, fromBlock, toBlock);

    for (const event of events) {
      const args = event.args;
      const block = await event.getBlock();
      const proposalId = args.proposalId.toString();

      const eventData: ProposalEvent = {
        type: 'ProposalExecuted',
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: Number(block.timestamp),
        data: { proposalId },
      };

      this.storageService.storeEvent(eventData);
    }
  }

  private async processVoteCastEvents(
    contract: any,
    fromBlock: number,
    toBlock: number,
  ) {
    const filter = contract.filters.VoteCast();
    const events = await contract.queryFilter(filter, fromBlock, toBlock);

    for (const event of events) {
      const args = event.args;
      const block = await event.getBlock();

      const vote: VoteData = {
        voter: args.voter,
        proposalId: args.proposalId.toString(),
        support: args.support,
        weight: args.weight.toString(),
        reason: args.reason,
        blockNumber: event.blockNumber,
        timestamp: Number(block.timestamp),
      };

      this.storageService.storeVote(vote);

      const eventData: ProposalEvent = {
        type: 'VoteCast',
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: Number(block.timestamp),
        data: vote,
      };

      this.storageService.storeEvent(eventData);
    }
  }
}
