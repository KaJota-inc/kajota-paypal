// Kajota Mesh contract addresses on Arbitrum Sepolia (chainId 421614).
// Deployed under KaJota-inc/kajota-arbitrum-singapore (HEAD 9f8fb5e).
// All contracts verified on Arbiscan.
//
// NOTE: addresses lifted verbatim from the Arbitrum Singapore substrate recon.
// Do not re-checksum by hand; viem's getAddress() will normalise them.

export const ARBITRUM_SEPOLIA_CHAIN_ID = 421614 as const;

/**
 * Mesh core contracts on Arbitrum Sepolia.
 */
export const MESH_ARBITRUM_SEPOLIA = {
  cosellRegistry: "0xfce6bd68d8d6f858d447f537d206c1e354b44315",
  cosellEscrow: "0x599869cef2e4c52e2c9074caaf8f9fb0cb191776",

  cosellRegistryV2: "0x5cda1ae03fd8207cb0c7416ddc899fe89a603ef9",
  cosellEscrowV2Usdc: "0xce77674ef1f3abcd34370825390f351eb6a8fffd",
  cosellEscrowV2Usdg: "0xfc82984e0282af934dca6c38d715235d491303c2",

  agentIdentityBinding: "0x716d9c1229d38ec6f6cd7a5edd781e757a73f629",

  x402DepositFacilitatorUsdc: "0xdbae565ce0be455e859cd8ff42aec8ad30bbbcf9",
  x402DepositFacilitatorUsdg: "0x15f42a9f92ab72ec67fb4298f9a95a476382d0ac",

  // PYUSD-flavoured pair deployed 2026-11-10 against Paxos's canonical
  // Arbitrum Sepolia PYUSD at 0x637A1259C6afd7E3AdF63993cA7E58BB438aB1B1.
  // Same bytecode as the USDC/USDG variants — `IERC20` at construction.
  cosellEscrowV2Pyusd: "0xde1f09351a7108c30e3cc7e59c63fe7dd5bb9a22",
  x402DepositFacilitatorPyusd: "0xd2a4fdb6972f37276f9b6895d77f8f1090075aea",
} as const;

/**
 * ERC-20 tokens on Arbitrum Sepolia used by Mesh.
 */
export const TOKENS_ARBITRUM_SEPOLIA = {
  /** Circle USDC on Arbitrum Sepolia (6 decimals). */
  usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  /** Paxos USDG on Arbitrum Sepolia (6 decimals). */
  usdg: "0xFFC95faa3d63Cde504a05B567C600B78C0b41892",
  /** Paxos PYUSD on Arbitrum Sepolia (6 decimals). */
  pyusd: "0x637A1259C6afd7E3AdF63993cA7E58BB438aB1B1",
} as const;

export type MeshContractKey = keyof typeof MESH_ARBITRUM_SEPOLIA;
export type MeshTokenKey = keyof typeof TOKENS_ARBITRUM_SEPOLIA;
