import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { myDAOABI } from './proposals.contract';
import {
  ProposalCreatedEvent,
  VotedEvent,
  ProposalExecutedEvent,
  Proposal,
} from './proposals.types';

@Injectable()
export class ProposalsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProposalsService.name);
  private provider: ethers.Provider;
  private contract: ethers.Contract;
  private lastProcessedBlock: number;
  private pollTimer: NodeJS.Timeout | null = null;
  private isPolling = false;
  private pollIntervalMs: number;
  private proposals: Map<number, Proposal> = new Map();
  private createdEvents: ProposalCreatedEvent[] = [];
  private votedEvents: VotedEvent[] = [];
  private executedEvents: ProposalExecutedEvent[] = [];

  constructor(private configService: ConfigService) {
    this.provider = this.providerInit();
    this.contract = this.contractInit();
    this.lastProcessedBlock = parseInt(
      this.configService.get<string>('START_BLOCK') || '0',
      10,
    );
    this.pollIntervalMs = parseInt(
      this.configService.get<string>('POLL_INTERVAL_MS') || '10000',
      10,
    );
  }

  async onModuleInit() {
    await this.indexHistoricEvents();
    this.startEventPolling();
  }

  onModuleDestroy() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
      this.logger.log('Event polling stopped');
    }
  }

  private providerInit() {
    const rpcURL = this.configService.get<string>('RPC_URL');
    return new ethers.JsonRpcProvider(rpcURL);
  }

  private contractInit(): ethers.Contract {
    const contractAddress = this.configService.get<string>('CONTRACT_ADDRESS');
    const contractABI = myDAOABI;
    return new ethers.Contract(contractAddress!, contractABI, this.provider);
  }

  private async indexHistoricEvents() {
    this.logger.log(
      `Indexing historic events from block ${this.lastProcessedBlock}`,
    );

    const currentBlock = await this.provider.getBlockNumber();
    const fromBlock = Math.max(this.lastProcessedBlock, 0);
    const toBlock = currentBlock;

    if (fromBlock > currentBlock) {
      this.lastProcessedBlock = currentBlock;
      this.logger.log(
        'Start block is ahead of current block, adjusted to current block',
      );
      return;
    }

    await this.pollEvents(fromBlock, toBlock);

    this.lastProcessedBlock = toBlock + 1;
    this.logger.log(
      `Indexed ${this.proposals.size} proposals up to block ${currentBlock}`,
    );
  }

  private startEventPolling() {
    this.logger.log(
      `Starting event polling with ${this.pollIntervalMs}ms interval`,
    );

    this.pollEventsWrapper();
    this.pollTimer = setInterval(
      () => this.pollEventsWrapper(),
      this.pollIntervalMs,
    );
  }

  private async pollEventsWrapper() {
    if (this.isPolling) {
      return;
    }

    this.isPolling = true;

    try {
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(this.lastProcessedBlock, 0);
      const toBlock = currentBlock;

      if (fromBlock > currentBlock) {
        this.lastProcessedBlock = currentBlock;
        return;
      }

      if (fromBlock <= toBlock) {
        await this.pollEvents(fromBlock, toBlock);
        this.lastProcessedBlock = toBlock + 1;
      }
    } catch (error) {
      this.logger.error('Error polling events:', error);
    } finally {
      this.isPolling = false;
    }
  }

  private async pollEvents(fromBlock: number, toBlock: number) {
    const createdFilter = this.contract.filters.ProposalCreated();
    const votedFilter = this.contract.filters.Voted();
    const executedFilter = this.contract.filters.ProposalExecuted();

    const [createdLogs, votedLogs, executedLogs] = await Promise.all([
      this.contract.queryFilter(createdFilter, fromBlock, toBlock),
      this.contract.queryFilter(votedFilter, fromBlock, toBlock),
      this.contract.queryFilter(executedFilter, fromBlock, toBlock),
    ]);

    for (const log of createdLogs) {
      if ('args' in log) {
        this.processProposalCreatedEvent(log);
      }
    }

    for (const log of votedLogs) {
      if ('args' in log) {
        this.processVotedEvent(log);
      }
    }

    for (const log of executedLogs) {
      if ('args' in log) {
        this.processProposalExecutedEvent(log);
      }
    }
  }

  private processProposalCreatedEvent(log: ethers.EventLog) {
    const id = Number(log.args.id);
    const creator = log.args.creator as string;
    const description = log.args.description as string;

    const event: ProposalCreatedEvent = {
      id,
      creator,
      description,
      blockNumber: log.blockNumber,
    };

    this.createdEvents.push(event);

    const proposal: Proposal = {
      id,
      description,
      creator,
      created: event,
      votes: [],
    };

    this.proposals.set(id, proposal);

    this.logger.log(
      `ProposalCreated - id: ${id}, description: ${description}, creator: ${creator}`,
    );
  }

  private processVotedEvent(log: ethers.EventLog) {
    const id = Number(log.args.id);
    const voter = log.args.voter as string;
    const support = log.args.support as boolean;

    const event: VotedEvent = {
      id,
      voter,
      support,
      blockNumber: log.blockNumber,
    };

    this.votedEvents.push(event);

    const proposal = this.proposals.get(id);
    if (proposal) {
      proposal.votes.push(event);
    }

    this.logger.log(`Voted - id: ${id}, support: ${support}, voter: ${voter}`);
  }

  private processProposalExecutedEvent(log: ethers.EventLog) {
    const id = Number(log.args.id);
    const executor = log.args.executor as string;

    const event: ProposalExecutedEvent = {
      id,
      executor,
      blockNumber: log.blockNumber,
    };

    this.executedEvents.push(event);

    const proposal = this.proposals.get(id);
    if (proposal) {
      proposal.executed = event;
    }

    this.logger.log(`ProposalExecuted - id: ${id}, executor: ${executor}`);
  }

  getAllProposals(): Proposal[] {
    return Array.from(this.proposals.values());
  }

  getProposalById(id: number): Proposal | null {
    return this.proposals.get(id) || null;
  }

  getVotesForProposal(id: number): VotedEvent[] {
    const proposal = this.proposals.get(id);
    return proposal?.votes || [];
  }

  getVotingResults(id: number): {
    proposalId: number;
    forVotes: number;
    againstVotes: number;
    totalVotes: number;
  } | null {
    const proposal = this.proposals.get(id);
    if (!proposal) {
      return null;
    }

    const forVotes = proposal.votes.filter((vote) => vote.support).length;
    const againstVotes = proposal.votes.filter((vote) => !vote.support).length;

    return {
      proposalId: id,
      forVotes,
      againstVotes,
      totalVotes: proposal.votes.length,
    };
  }
}
