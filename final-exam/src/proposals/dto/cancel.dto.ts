export class CancelDto {
  proposalId: string;
  targets: string[];
  values: string[];
  calldatas: string[];
  descriptionHash: string;
}
