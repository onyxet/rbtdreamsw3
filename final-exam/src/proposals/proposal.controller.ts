import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ProposalService } from './proposal.service';
import { ProposalStorageService } from './proposal-storage.service';
import { VoteDto } from './dto/vote.dto';
import { QueueDto } from './dto/queue.dto';
import { ExecuteDto } from './dto/execute.dto';
import { CancelDto } from './dto/cancel.dto';
import { ProposalState } from './proposal.interface';

@Controller('proposals')
export class ProposalController {
  constructor(
    private readonly proposalService: ProposalService,
    private readonly storageService: ProposalStorageService,
  ) {}

  @Get()
  async getAllProposals() {
    const proposals = await this.proposalService.getAllProposals();
    return {
      count: proposals.length,
      proposals,
    };
  }

  @Get('events')
  getAllEvents() {
    const events = this.storageService.getAllEvents();
    return {
      count: events.length,
      events,
    };
  }

  @Get('queue')
  async getProposalQueue() {
    const proposals = await this.proposalService.getProposalQueue();
    return {
      count: proposals.length,
      proposals,
    };
  }

  @Get('executed')
  async getExecutedProposals() {
    const proposals = await this.proposalService.getProposalsByState(
      ProposalState.Executed,
    );
    return {
      count: proposals.length,
      proposals,
    };
  }

  @Get('canceled')
  async getCanceledProposals() {
    const proposals = await this.proposalService.getProposalsByState(
      ProposalState.Canceled,
    );
    return {
      count: proposals.length,
      proposals,
    };
  }

  @Get('defeated')
  async getDefeatedProposals() {
    const proposals = await this.proposalService.getProposalsByState(
      ProposalState.Defeated,
    );
    return {
      count: proposals.length,
      proposals,
    };
  }

  @Get('succeeded')
  async getSucceededProposals() {
    const proposals = await this.proposalService.getProposalsByState(
      ProposalState.Succeeded,
    );
    return {
      count: proposals.length,
      proposals,
    };
  }

  @Get('expired')
  async getExpiredProposals() {
    const proposals = await this.proposalService.getProposalsByState(
      ProposalState.Expired,
    );
    return {
      count: proposals.length,
      proposals,
    };
  }

  @Get(':id')
  async getProposalById(@Param('id') id: string) {
    const proposal = await this.proposalService.getProposalById(id);
    if (!proposal) {
      return {
        error: 'Proposal not found',
        proposalId: id,
      };
    }
    return proposal;
  }

  @Post('vote')
  async voteOnProposal(@Body() voteDto: VoteDto) {
    return this.proposalService.voteOnProposal(voteDto);
  }

  @Post('queue')
  async queueProposal(@Body() queueDto: QueueDto) {
    return this.proposalService.queueProposal(queueDto);
  }

  @Post('execute')
  async executeProposal(@Body() executeDto: ExecuteDto) {
    return this.proposalService.executeProposal(executeDto);
  }

  @Post('cancel')
  async cancelProposal(@Body() cancelDto: CancelDto) {
    return this.proposalService.cancelProposal(cancelDto);
  }
}
