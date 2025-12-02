import { Controller, Get, NotFoundException, BadRequestException, Param } from '@nestjs/common';

import { ProposalsService } from './proposals.service';

@Controller('proposals')
export class ProposalsController {
  constructor(private proposalsService: ProposalsService) {}

  @Get('getProposalCreatedEvents')
  async getProposalCreatedEvents() {
    try {
      const events = await this.proposalsService.proposalEvents();
      return events;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  @Get(':id')
  async getProposal(@Param('id') id: string) {
    try {
      const proposal = await this.proposalsService.getProposal(Number(id));
      return proposal;
    } catch {
      throw new NotFoundException(`Proposal with id ${id} not found`);
    }
  }
}
