import { Injectable } from '@nestjs/common';
import { ethers, AbiCoder, id } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { myDAOABI } from './proposals.contract';

@Injectable()
export class ProposalsService {
  private provider: ethers.Provider;
  private contract: ethers.Contract;
  private executor: string;
  private proposalID: number;
  constructor(private configService: ConfigService) {
    this.provider = this.providerInit();
    this.contract = this.contractInit();
  }
  private providerInit() {
    // Fancy error handling comes here. Just close your eyes and imagine it
    const rpcURL = this.configService.get<string>('RPC_URL');
    return new ethers.JsonRpcProvider(rpcURL);
  }

  private contractInit(): ethers.Contract {
    // Fancy error handling comes here. Just close your eyes and imagine it
    const contractAddress = this.configService.get<string>('CONTRACT_ADDRESS');
    const contractABI = myDAOABI;
    return new ethers.Contract(contractAddress!, contractABI, this.provider);
  }

  async getProposal(id: number) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const proposal = await this.contract.getProposal(id);
      return {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        id: Number(proposal.id),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        description: proposal.description,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        executed: proposal.executed,
      };
    } catch (error) {
      // here is err handling BTW!
      console.error('Error fetching proposal:', error);
      throw error;
    }
  }
  async proposalEvents() {
    let filter = this.contract.filters.ProposalExecuted();
    let events = await this.contract.queryFilter(filter);

    const executedEvents = events
      .filter((event): event is ethers.EventLog => 'args' in event)
      .map((event) => ({
        proposalId: Number(event.args.id),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        executor: event.args.executor,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      }));
    filter = this.contract.filters.ProposalCreated();
    events = await this.contract.queryFilter(filter);
    const proposalEvents = events
      .filter((event): event is ethers.EventLog => 'args' in event)
      .map((event) => ({
        id: Number(event.args[0]),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        creator: event.args[1],
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        description: event.args[2],
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      }));

    return {
      Proposal_Executed: executedEvents,
      Proposal_Created: proposalEvents,
    };
  }
}
