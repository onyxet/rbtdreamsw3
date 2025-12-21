import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ProposalsService } from './proposals.service';

@Controller('proposals')
export class ProposalsController {
  constructor(private proposalsService: ProposalsService) {}

  @Get()
  getAllProposals() {
    return this.proposalsService.getAllProposals();
  }

  @Get(':id/votes')
  getVotesForProposal(@Param('id') id: string) {
    const votes = this.proposalsService.getVotesForProposal(Number(id));
    if (!votes) {
      throw new NotFoundException(`Proposal with id ${id} not found`);
    }
    return votes;
  }
}
