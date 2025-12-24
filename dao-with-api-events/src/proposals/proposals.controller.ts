import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ProposalsService } from './proposals.service';

@Controller('proposals')
export class ProposalsController {
  constructor(private proposalsService: ProposalsService) {}

  @Get()
  getAllProposals() {
    return this.proposalsService.getAllProposals();
  }

  @Get(':id')
  getProposalById(@Param('id') id: string) {
    const proposal = this.proposalsService.getProposalById(Number(id));
    if (!proposal) {
      throw new NotFoundException(`Proposal with id ${id} not found`);
    }
    return proposal;
  }

  @Get(':id/votes')
  getVotesForProposal(@Param('id') id: string) {
    const votes = this.proposalsService.getVotesForProposal(Number(id));
    if (!votes) {
      throw new NotFoundException(`Proposal with id ${id} not found`);
    }
    return votes;
  }

  @Get('results/:id')
  getVotingResults(@Param('id') id: string) {
    const results = this.proposalsService.getVotingResults(Number(id));
    if (!results) {
      throw new NotFoundException(`Proposal with id ${id} not found`);
    }
    return results;
  }
}
