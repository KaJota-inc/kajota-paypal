/**
 * Minimal typed ABI fragments for the Mesh v2 contracts, mirrored from
 * `kajota-arbitrum-singapore/contracts/CosellRegistryV2.sol` and
 * `CosellEscrowV2.sol` at HEAD `9f8fb5e`.
 *
 * Only the methods, events and errors the PayPal integration actually needs
 * are included — a judge pointed at Arbiscan can see the full ABI there.
 */

export const COSELL_REGISTRY_V2_ABI = [
  {
    type: "function",
    name: "register",
    stateMutability: "nonpayable",
    inputs: [
      { name: "productId", type: "string" },
      { name: "recipients", type: "address[]" },
      { name: "shares", type: "uint16[]" },
      { name: "currency", type: "string" },
    ],
    outputs: [{ name: "listingId", type: "bytes32" }],
  },
  {
    type: "function",
    name: "getListing",
    stateMutability: "view",
    inputs: [{ name: "listingId", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "productId", type: "string" },
          { name: "registrant", type: "address" },
          { name: "recipients", type: "address[]" },
          { name: "shares", type: "uint16[]" },
          { name: "currency", type: "string" },
          { name: "registeredAt", type: "uint64" },
          { name: "active", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "computeListingId",
    stateMutability: "pure",
    inputs: [
      { name: "productId", type: "string" },
      { name: "registrant", type: "address" },
      { name: "recipients", type: "address[]" },
      { name: "shares", type: "uint16[]" },
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "computeSplit",
    stateMutability: "view",
    inputs: [
      { name: "grossAmount", type: "uint256" },
      { name: "listingId", type: "bytes32" },
    ],
    outputs: [{ name: "perRecipient", type: "uint256[]" }],
  },
  {
    type: "function",
    name: "deactivate",
    stateMutability: "nonpayable",
    inputs: [{ name: "listingId", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "BPS_DENOMINATOR",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint16" }],
  },
  {
    type: "function",
    name: "MAX_RECIPIENTS",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "ListingRegistered",
    anonymous: false,
    inputs: [
      { indexed: true, name: "listingId", type: "bytes32" },
      { indexed: true, name: "registrant", type: "address" },
      { indexed: false, name: "productId", type: "string" },
      { indexed: false, name: "recipients", type: "address[]" },
      { indexed: false, name: "shares", type: "uint16[]" },
      { indexed: false, name: "currency", type: "string" },
    ],
  },
  {
    type: "event",
    name: "ListingDeactivated",
    anonymous: false,
    inputs: [
      { indexed: true, name: "listingId", type: "bytes32" },
      { indexed: true, name: "by", type: "address" },
    ],
  },
] as const;

export const COSELL_ESCROW_V2_ABI = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "listingId", type: "bytes32" },
      { name: "grossAmount", type: "uint256" },
    ],
    outputs: [{ name: "depositId", type: "bytes32" }],
  },
  {
    type: "function",
    name: "release",
    stateMutability: "nonpayable",
    inputs: [{ name: "depositId", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "refund",
    stateMutability: "nonpayable",
    inputs: [{ name: "depositId", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getDeposit",
    stateMutability: "view",
    inputs: [{ name: "depositId", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "listingId", type: "bytes32" },
          { name: "buyer", type: "address" },
          { name: "grossAmount", type: "uint256" },
          { name: "depositedAt", type: "uint64" },
          { name: "state", type: "uint8" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "releaseAuth",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "REFUND_DELAY",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint64" }],
  },
  {
    type: "event",
    name: "Deposited",
    anonymous: false,
    inputs: [
      { indexed: true, name: "depositId", type: "bytes32" },
      { indexed: true, name: "listingId", type: "bytes32" },
      { indexed: true, name: "buyer", type: "address" },
      { indexed: false, name: "grossAmount", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "Released",
    anonymous: false,
    inputs: [
      { indexed: true, name: "depositId", type: "bytes32" },
      { indexed: true, name: "listingId", type: "bytes32" },
      { indexed: false, name: "recipients", type: "address[]" },
      { indexed: false, name: "amounts", type: "uint256[]" },
    ],
  },
  {
    type: "event",
    name: "Refunded",
    anonymous: false,
    inputs: [
      { indexed: true, name: "depositId", type: "bytes32" },
      { indexed: true, name: "buyer", type: "address" },
      { indexed: false, name: "grossAmount", type: "uint256" },
    ],
  },
] as const;

export const ERC20_MIN_ABI = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
