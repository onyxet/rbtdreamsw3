export const blockchainConfig = {
  rpcUrl: process.env.RPC_URL || 'https://0xrpc.io/sep',
  contractAddress: process.env.CONTRACT_ADDRESS || '0x6FB2D444784818DD62D353F284Cc2B8FffbAA96D',
  startBlock: 9946498,
  pollInterval: parseInt(process.env.POLL_INTERVAL || '12000', 10),
};
