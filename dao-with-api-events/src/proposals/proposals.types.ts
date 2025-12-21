export interface ProposalCreatedEvent {
  id: number;
  creator: string;
  description: string;
  blockNumber: number;
}

export interface VotedEvent {
  id: number;
  voter: string;
  support: boolean;
  blockNumber: number;
}

export interface ProposalExecutedEvent {
  id: number;
  executor: string;
  blockNumber: number;
}

export interface Proposal {
  id: number;
  description: string;
  creator: string;
  created: ProposalCreatedEvent;
  votes: VotedEvent[];
  executed?: ProposalExecutedEvent;
}
