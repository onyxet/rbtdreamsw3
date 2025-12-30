import { Injectable } from '@nestjs/common';
import { ProposalData, VoteData, ProposalEvent } from './proposal.interface';

@Injectable()
export class ProposalStorageService {
  private proposals: Map<string, ProposalData> = new Map();
  private votes: Map<string, VoteData[]> = new Map();
  private events: ProposalEvent[] = [];
  private lastProcessedBlock: number = 0;

  storeProposal(proposal: ProposalData): void {
    this.proposals.set(proposal.proposalId, proposal);
    console.log(`Stored proposal ${proposal.proposalId}: ${proposal.description}`);
  }

  updateProposal(proposalId: string, updates: Partial<ProposalData>): void {
    const proposal = this.proposals.get(proposalId);
    if (proposal) {
      this.proposals.set(proposalId, { ...proposal, ...updates });
      console.log(`Updated proposal ${proposalId}`);
    }
  }

  getProposal(proposalId: string): ProposalData | undefined {
    return this.proposals.get(proposalId);
  }

  getAllProposals(): ProposalData[] {
    return Array.from(this.proposals.values()).sort(
      (a, b) => a.createdAtBlock - b.createdAtBlock,
    );
  }

  storeVote(vote: VoteData): void {
    const votes = this.votes.get(vote.proposalId) || [];
    votes.push(vote);
    this.votes.set(vote.proposalId, votes);
    console.log(
      `Stored vote for proposal ${vote.proposalId} from ${vote.voter}`,
    );
  }

  getVotes(proposalId: string): VoteData[] {
    return this.votes.get(proposalId) || [];
  }

  storeEvent(event: ProposalEvent): void {
    this.events.push(event);
    console.log(
      `Event ${event.type} at block ${event.blockNumber}, tx: ${event.transactionHash}`,
    );
  }

  getAllEvents(): ProposalEvent[] {
    return [...this.events].sort((a, b) => a.blockNumber - b.blockNumber);
  }

  setLastProcessedBlock(blockNumber: number): void {
    this.lastProcessedBlock = blockNumber;
  }

  getLastProcessedBlock(): number {
    return this.lastProcessedBlock;
  }
}
