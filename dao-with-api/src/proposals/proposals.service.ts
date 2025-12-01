import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { myDAOABI } from './proposals.contract';

@Injectable()
export class ProposalsService {
  private provider: ethers.Provider;
  private contract: ethers.Contract;
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

  async getAllProposals() {
    try {
      const proposals: Array<{
        id: number;
        description: string;
        executed: boolean;
      }> = [];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const proposalCount = await this.contract.proposalCount();
      const count = Number(proposalCount);

      for (let i = 1; i <= count; i++) {
        const proposal = await this.getProposal(i);
        proposals.push(proposal);
      }
      return proposals;
    } catch (error) {
      console.error('Error fetching proposals:', error);
      throw error;
    }
  }
}
