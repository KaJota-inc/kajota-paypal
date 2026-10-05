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

/**
 * Approve PYUSD, then call `CosellEscrowV2(PYUSD).deposit(listingId, grossAmount)`.
 * Returns the `depositId` extracted from the `Deposited` event.
 *
 * Phase A: the PYUSD escrow pair address is not yet set in
 * `addresses.ts` — this function throws until deployment lands. The call
 * surface is in place so the webhook route can import it today.
 */
export async function depositPyusd(args: {
  listingId: Hex;
  grossAmount: bigint;
}): Promise<{ depositId: Hex; approveTxHash: Hex; depositTxHash: Hex }> {
  const escrow = MESH_ARBITRUM_SEPOLIA.cosellEscrowV2Pyusd;
  if (!escrow) {
    throw new Error(
      "cosellEscrowV2Pyusd not deployed yet — see Phase A day 4 in docs/planning/plan.md",
    );
  }

  const wallet = orchestrationWallet();
  const client = publicArbSepolia();

  const approveTxHash = await wallet.writeContract({
    address: TOKENS_ARBITRUM_SEPOLIA.pyusd,
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
  const escrow = MESH_ARBITRUM_SEPOLIA.cosellEscrowV2Pyusd;
  if (!escrow) {
    throw new Error("cosellEscrowV2Pyusd not deployed yet");
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
  const escrow = MESH_ARBITRUM_SEPOLIA.cosellEscrowV2Pyusd;
  if (!escrow) {
    throw new Error("cosellEscrowV2Pyusd not deployed yet");
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
