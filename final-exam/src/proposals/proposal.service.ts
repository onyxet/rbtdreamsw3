import { Injectable } from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ProposalStorageService } from './proposal-storage.service';
import { ProposalData, ProposalState } from './proposal.interface';
import { VoteDto } from './dto/vote.dto';
import { QueueDto } from './dto/queue.dto';
import { ExecuteDto } from './dto/execute.dto';
import { CancelDto } from './dto/cancel.dto';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { ethers } from 'ethers';

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

    try {
      // Check if proposal exists and get its state
      const proposalData = this.storageService.getProposal(voteDto.proposalId);
      if (!proposalData) {
        return {
          success: false,
          error: 'Proposal not found',
          message: 'The specified proposal does not exist',
        };
      }

      // Get proposal state from contract
      const state = await contract.state(voteDto.proposalId);
      const stateNumber = Number(state);

      console.log(`Vote check: proposalId=${voteDto.proposalId}, state=${state}, stateNumber=${stateNumber}, type=${typeof state}`);

      // ProposalState.Active = 1
      if (stateNumber !== 1) {
        return {
          success: false,
          error: 'Proposal not active',
          message: 'You can only vote on active proposals',
          currentState: stateNumber,
        };
      }

      // Encode the castVote or castVoteWithReason function call
      let voteData: string;
      if (voteDto.reason && voteDto.reason.trim()) {
        // Use castVoteWithReason if reason is provided
        voteData = contract.interface.encodeFunctionData('castVoteWithReason', [
          voteDto.proposalId,
          voteDto.support,
          voteDto.reason,
        ]);
      } else {
        // Use castVote if no reason
        voteData = contract.interface.encodeFunctionData('castVote', [
          voteDto.proposalId,
          voteDto.support,
        ]);
      }

      return {
        success: true,
        message: 'Vote transaction data prepared',
        proposalId: voteDto.proposalId,
        support: voteDto.support,
        reason: voteDto.reason || '',
        to: await contract.getAddress(),
        data: voteData,
        note: 'Sign and submit this transaction with your wallet to cast your vote.',
      };
    } catch (error) {
      console.error('Error preparing vote:', error);
      return {
        success: false,
        error: 'Failed to prepare vote transaction',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
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

  async createProposal(createDto: CreateProposalDto): Promise<any> {
    const contract = this.blockchainService.getContract();
    console.log(`Create proposal request from ${createDto.proposerAddress}`);

    try {
      // Get the proposal threshold
      const proposalThreshold = await contract.proposalThreshold();
      console.log(`Proposal threshold: ${proposalThreshold.toString()}`);

      // Get the token contract address
      const tokenAddress = await contract.token();
      console.log(`Token address: ${tokenAddress}`);

      // Create token contract instance to check voting power
      const provider = this.blockchainService.getProvider();
      const tokenABI = [
        'function getVotes(address account) external view returns (uint256)',
        'function getPastVotes(address account, uint256 timepoint) external view returns (uint256)'
      ];
      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);

      // Get current block number
      const currentBlock = await provider.getBlockNumber();

      // Check voting power - use getPastVotes with previous block to get delegated votes
      let votingPower: bigint;
      try {
        // Try getPastVotes first (for delegated voting power at a past block)
        votingPower = await tokenContract.getPastVotes(createDto.proposerAddress, currentBlock - 1);
      } catch (error) {
        // Fallback to getVotes (current voting power)
        console.log('getPastVotes not available, using getVotes');
        votingPower = await tokenContract.getVotes(createDto.proposerAddress);
      }

      console.log(`Voting power for ${createDto.proposerAddress}: ${votingPower.toString()}`);

      // Check if proposer has enough voting power
      if (votingPower < proposalThreshold) {
        return {
          success: false,
          error: 'Insufficient voting power',
          message: `You need at least ${ethers.formatEther(proposalThreshold)} tokens to create a proposal. You have ${ethers.formatEther(votingPower)} voting power.`,
          required: proposalThreshold.toString(),
          current: votingPower.toString(),
        };
      }

      // Encode the function call
      const proposalData = contract.interface.encodeFunctionData('propose', [
        createDto.targets,
        createDto.values,
        createDto.calldatas,
        createDto.description,
      ]);

      return {
        success: true,
        message: 'Proposal transaction data prepared',
        description: createDto.description,
        votingPower: votingPower.toString(),
        proposalThreshold: proposalThreshold.toString(),
        transactionData: {
          to: await contract.getAddress(),
          data: proposalData,
          from: createDto.proposerAddress,
        },
        note: 'This endpoint provides transaction data. Sign and submit this transaction with your wallet to create the proposal on-chain.',
      };
    } catch (error) {
      console.error('Error preparing proposal:', error);
      return {
        success: false,
        error: 'Failed to prepare proposal transaction',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  getStateLabel(state: ProposalState): string {
    return ProposalState[state];
  }
}
