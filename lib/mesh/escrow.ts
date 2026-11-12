import type { Address, Hex } from "viem";
import { parseEventLogs } from "viem";
import { COSELL_ESCROW_V2_ABI, ERC20_MIN_ABI } from "./abi";
import { MESH_ARBITRUM_SEPOLIA, TOKENS_ARBITRUM_SEPOLIA } from "./addresses";
import {
  orchestrationWallet,
  publicArbSepolia,
  releaseAuthWallet,
} from "./clients";

export type DepositState = "Pending" | "Released" | "Refunded";

const DEPOSIT_STATE_LABELS: Record<number, DepositState> = {
  0: "Pending",
  1: "Released",
  2: "Refunded",
};

export type MeshDeposit = {
  listingId: Hex;
  buyer: Address;
  grossAmount: bigint;
  depositedAt: bigint;
  state: DepositState;
};

// The settlement escrow/token used by the live webhook. Points at the
// USDC-flavoured CosellEscrowV2 so the every-6h GH-Actions runner can
// fire real on-chain cycles against a wallet with a funded balance —
// Paxos's Arbitrum Sepolia PYUSD testnet faucet has a human-verification
// gate (see LIVE_SETTLEMENTS.md "Why USDC not PYUSD"). The escrow
// bytecode is IERC20-polymorphic (HARD_PARTS scar #8), so swapping to
// the PYUSD pair is a one-line flip once PYUSD funding lands.
const SETTLEMENT_ESCROW = MESH_ARBITRUM_SEPOLIA.cosellEscrowV2Usdc;
const SETTLEMENT_TOKEN = TOKENS_ARBITRUM_SEPOLIA.usdc;

/**
 * Approve the settlement token, then call
 * `CosellEscrowV2.deposit(listingId, grossAmount)`. Returns the `depositId`
 * extracted from the `Deposited` event.
 */
export async function depositPyusd(args: {
  listingId: Hex;
  grossAmount: bigint;
}): Promise<{ depositId: Hex; approveTxHash: Hex; depositTxHash: Hex }> {
  const escrow = SETTLEMENT_ESCROW;
  if (!escrow) {
    throw new Error(
      "SETTLEMENT_ESCROW not deployed yet — see Phase A day 4 in docs/planning/plan.md",
    );
  }

  const wallet = orchestrationWallet();
  const client = publicArbSepolia();

  const approveTxHash = await wallet.writeContract({
    address: SETTLEMENT_TOKEN,
    abi: ERC20_MIN_ABI,
    functionName: "approve",
    args: [escrow, args.grossAmount],
  });
  await client.waitForTransactionReceipt({ hash: approveTxHash });

  const depositTxHash = await wallet.writeContract({
    address: escrow,
    abi: COSELL_ESCROW_V2_ABI,
    functionName: "deposit",
    args: [args.listingId, args.grossAmount],
  });
  const receipt = await client.waitForTransactionReceipt({
    hash: depositTxHash,
  });

  const [event] = parseEventLogs({
    abi: COSELL_ESCROW_V2_ABI,
    eventName: "Deposited",
    logs: receipt.logs,
  });
  if (!event) {
    throw new Error("Deposited event not found in receipt");
  }
  return {
    depositId: event.args.depositId,
    approveTxHash,
    depositTxHash,
  };
}

/** Trigger the N-way fan-out. Only the release-auth wallet can call this. */
export async function releaseDeposit(depositId: Hex): Promise<Hex> {
  const escrow = SETTLEMENT_ESCROW;
  if (!escrow) {
    throw new Error("SETTLEMENT_ESCROW not deployed yet");
  }
  const wallet = releaseAuthWallet();
  return wallet.writeContract({
    address: escrow,
    abi: COSELL_ESCROW_V2_ABI,
    functionName: "release",
    args: [depositId],
  });
}

export async function getDeposit(depositId: Hex): Promise<MeshDeposit> {
  const escrow = SETTLEMENT_ESCROW;
  if (!escrow) {
    throw new Error("SETTLEMENT_ESCROW not deployed yet");
  }
  const client = publicArbSepolia();
  const result = await client.readContract({
    address: escrow,
    abi: COSELL_ESCROW_V2_ABI,
    functionName: "getDeposit",
    args: [depositId],
  });
  return {
    listingId: result.listingId,
    buyer: result.buyer,
    grossAmount: result.grossAmount,
    depositedAt: result.depositedAt,
    state: DEPOSIT_STATE_LABELS[result.state] ?? "Pending",
  };
}
