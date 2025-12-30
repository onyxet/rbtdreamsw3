import { IsString, IsNumber, IsOptional, IsEthereumAddress, Min, Max } from 'class-validator';

export class VoteDto {
  @IsString()
  proposalId: string;

  @IsNumber()
  @Min(0)
  @Max(2)
  support: number; // 0 = Against, 1 = For, 2 = Abstain

  @IsOptional()
  @IsString()
  reason?: string;

  @IsEthereumAddress()
  voterAddress: string;
}
