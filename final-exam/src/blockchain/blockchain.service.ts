import { Injectable, OnModuleInit } from '@nestjs/common';
import { ethers } from 'ethers';
import { blockchainConfig } from './blockchain.config';
import FaithDAOABI from '../contracts/FaithDAO.abi.json';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;

  onModuleInit() {
    this.provider = new ethers.JsonRpcProvider(blockchainConfig.rpcUrl);
    this.contract = new ethers.Contract(
      blockchainConfig.contractAddress,
      FaithDAOABI,
      this.provider,
    );
    console.log(
      `Connected to blockchain at ${blockchainConfig.rpcUrl}`,
    );
    console.log(
      `FaithDAO contract: ${blockchainConfig.contractAddress}`,
    );
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  getContract(): ethers.Contract {
    return this.contract;
  }

  getStartBlock(): number {
    return blockchainConfig.startBlock;
  }

  getPollInterval(): number {
    return blockchainConfig.pollInterval;
  }
}
