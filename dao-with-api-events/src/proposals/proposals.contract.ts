export const myDAOABI = [
  "error OwnableInvalidOwner(address owner)",
  "error OwnableUnauthorizedAccount(address account)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
  "event ProposalCreated(uint256 id, address creator, string description)",
  "event ProposalExecuted(uint256 id, address executor)",
  "function owner() view returns (address)",
  "function proposalCount() view returns (uint256)",
  "function getProposal(uint256 _id) view returns (tuple(uint256 id, string description, bool executed))",
  "function proposals(uint256) view returns (uint256 id, string description, bool executed)",
  "function createProposal(string _description) returns (tuple(uint256 id, string description, bool executed))",
  "function executeProposal(uint256 _id)",
  "function transferOwnership(address newOwner)",
  "function renounceOwnership()"
];
