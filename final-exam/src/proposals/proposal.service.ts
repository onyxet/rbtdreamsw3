import { Injectable } from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ProposalStorageService } from './proposal-storage.service';
import { ProposalData, ProposalState } from './proposal.interface';
import { VoteDto } from './dto/vote.dto';
import { QueueDto } from './dto/queue.dto';
import { ExecuteDto } from './dto/execute.dto';
import { CancelDto } from './dto/cancel.dto';

@Injectable()
export class ProposalService {
  constructor(
    private blockchainService: BlockchainService,
    private storageService: ProposalStorageService,
  ) {}

  async getAllProposals(): Promise<ProposalData[]> {
    const proposals = this.storageService.getAllProposals();
    const contract = this.blockchainService.getContract();
    for (const proposal of proposals) {
      try {
        const state = await contract.state(proposal.proposalId);
        proposal.state = state;
        const votes = await contract.proposalVotes(proposal.proposalId);
        proposal.againstVotes = votes.againstVotes.toString();
        proposal.forVotes = votes.forVotes.toString();
        proposal.abstainVotes = votes.abstainVotes.toString();
      } catch (error) {
        console.error(`Error fetching state for proposal ${proposal.proposalId}:`, error);
      }
    }

    return proposals;
  }

  async getProposalById(proposalId: string): Promise<ProposalData | null> {
    const proposal = this.storageService.getProposal(proposalId);
    if (!proposal) {
      return null;
    }

    const contract = this.blockchainService.getContract();
    try {
      const state = await contract.state(proposalId);
      proposal.state = state;

      const votes = await contract.proposalVotes(proposalId);
      proposal.againstVotes = votes.againstVotes.toString();
      proposal.forVotes = votes.forVotes.toString();
      proposal.abstainVotes = votes.abstainVotes.toString();
      const votesList = this.storageService.getVotes(proposalId);
      return {
        ...proposal,
        votes: votesList,
      } as any;
    } catch (error) {
      console.error(`Error fetching proposal ${proposalId}:`, error);
      return proposal;
    }
  }

  async getProposalsByState(state: ProposalState): Promise<ProposalData[]> {
    const allProposals = await this.getAllProposals();
    return allProposals.filter((p) => p.state === state);
  }

  async voteOnProposal(voteDto: VoteDto): Promise<any> {
    const contract = this.blockchainService.getContract();
    console.log(`Vote request for proposal ${voteDto.proposalId}:`, voteDto);

    return {
      message: 'Vote transaction data prepared',
      proposalId: voteDto.proposalId,
      support: voteDto.support,
      reason: voteDto.reason || '',
      note: 'This endpoint provides transaction data. To execute, you need a wallet with signing capability.',
    };
  }

  async queueProposal(queueDto: QueueDto): Promise<any> {
    console.log(`Queue request for proposal ${queueDto.proposalId}`);

    return {
      message: 'Queue transaction data prepared',
      proposalId: queueDto.proposalId,
      note: 'This endpoint provides transaction data. To execute, you need a wallet with signing capability.',
    };
  }

  async executeProposal(executeDto: ExecuteDto): Promise<any> {
    console.log(`Execute request for proposal ${executeDto.proposalId}`);

    return {
      message: 'Execute transaction data prepared',
      proposalId: executeDto.proposalId,
      note: 'This endpoint provides transaction data. To execute, you need a wallet with signing capability.',
    };
  }

  async cancelProposal(cancelDto: CancelDto): Promise<any> {
    console.log(`Cancel request for proposal ${cancelDto.proposalId}`);

    return {
      message: 'Cancel transaction data prepared',
      proposalId: cancelDto.proposalId,
      note: 'This endpoint provides transaction data. To execute, you need a wallet with signing capability.',
    };
  }

  async getProposalQueue(): Promise<ProposalData[]> {
    return this.getProposalsByState(ProposalState.Queued);
  }

  getStateLabel(state: ProposalState): string {
    return ProposalState[state];
  }
}
