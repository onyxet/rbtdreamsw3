export class VoteDto {
  proposalId: string;
  support: number; // 0 = Against, 1 = For, 2 = Abstain
  reason?: string;
}
