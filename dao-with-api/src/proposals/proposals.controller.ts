import { Controller, Get, NotFoundException, Param } from '@nestjs/common';

import { ProposalsService } from './proposals.service';

@Controller('proposals')
export class ProposalsController {
  constructor(private proposalsService: ProposalsService) {}

  @Get(':id')
  async getProposal(@Param('id') id: string) {
    try {
      const proposal = await this.proposalsService.getProposal(Number(id));
      return proposal;
    } catch {
      throw new NotFoundException(`Proposal with id ${id} not found`);
    }
  }

  @Get()
  async getProposals() {
    try {
      return await this.proposalsService.getAllProposals();
    } catch {
      throw new NotFoundException(`Houston we have a problem here`);
    }
  }
}
