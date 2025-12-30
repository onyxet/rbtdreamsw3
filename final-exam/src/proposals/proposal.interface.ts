export enum ProposalState {
  Pending = 0,
  Active = 1,
  Canceled = 2,
  Defeated = 3,
  Succeeded = 4,
  Queued = 5,
  Expired = 6,
  Executed = 7,
}

export interface ProposalData {
  proposalId: string;
  proposer: string;
  targets: string[];
  values: string[];
  signatures: string[];
  calldatas: string[];
  voteStart: string;
  voteEnd: string;
  description: string;
  createdAtBlock: number;
  createdAtTimestamp?: number;
  state?: ProposalState;
  etaSeconds?: string;
  forVotes?: string;
  againstVotes?: string;
  abstainVotes?: string;
}

export interface VoteData {
  voter: string;
  proposalId: string;
  support: number;
  weight: string;
  reason: string;
  blockNumber: number;
  timestamp?: number;
}

export interface ProposalEvent {
  type: 'ProposalCreated' | 'ProposalCanceled' | 'ProposalExecuted' | 'ProposalQueued' | 'VoteCast';
  blockNumber: number;
  transactionHash: string;
  timestamp?: number;
  data: any;
}
