import { IsString, IsArray, IsNotEmpty, IsEthereumAddress } from 'class-validator';

export class CreateProposalDto {
  @IsEthereumAddress()
  @IsNotEmpty()
  proposerAddress: string;

  @IsArray()
  @IsEthereumAddress({ each: true })
  @IsNotEmpty()
  targets: string[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  values: string[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  calldatas: string[];

  @IsString()
  @IsNotEmpty()
  description: string;
}
