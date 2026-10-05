import type { Address, Hex } from "viem";
import { COSELL_REGISTRY_V2_ABI } from "./abi";
import { MESH_ARBITRUM_SEPOLIA } from "./addresses";
import { orchestrationWallet, publicArbSepolia } from "./clients";

export type MeshListing = {
  productId: string;
  registrant: Address;
  recipients: readonly Address[];
  shares: readonly number[];
  currency: string;
  registeredAt: bigint;
  active: boolean;
};

/**
 * Register a new N-party listing on `CosellRegistryV2`.
 *
 * All invariants are enforced on-chain (recipient count 2..16, non-zero
 * recipients, non-zero shares, uniqueness, sum == 10 000). This function
 * does not re-validate client-side; a judge reading the transaction's
 * `ListingRegistered` event sees exactly what was accepted.
 */
export async function registerListing(args: {
  productId: string;
  recipients: readonly Address[];
  shares: readonly number[];
  currency: string;
}): Promise<{ listingId: Hex; txHash: Hex }> {
  const wallet = orchestrationWallet();
  const txHash = await wallet.writeContract({
    address: MESH_ARBITRUM_SEPOLIA.cosellRegistryV2,
    abi: COSELL_REGISTRY_V2_ABI,
    functionName: "register",
    args: [args.productId, args.recipients, args.shares, args.currency],
  });

  const listingId = await computeListingId(
    args.productId,
    wallet.account.address,
    args.recipients,
    args.shares,
  );

  return { listingId, txHash };
}

/**
 * Pure, off-chain mirror of `CosellRegistryV2.computeListingId`. The on-chain
 * implementation is `keccak256(abi.encode(productId, registrant, recipients, shares))`.
 * Rather than reimplement AbiCoder from scratch, we call the pure method
 * through the public client — this costs nothing in gas (view call).
 */
export async function computeListingId(
  productId: string,
  registrant: Address,
  recipients: readonly Address[],
  shares: readonly number[],
): Promise<Hex> {
  const client = publicArbSepolia();
  const result = await client.readContract({
    address: MESH_ARBITRUM_SEPOLIA.cosellRegistryV2,
    abi: COSELL_REGISTRY_V2_ABI,
    functionName: "computeListingId",
    args: [productId, registrant, recipients, shares],
  });
  return result;
}

export async function getListing(listingId: Hex): Promise<MeshListing> {
  const client = publicArbSepolia();
  const result = await client.readContract({
    address: MESH_ARBITRUM_SEPOLIA.cosellRegistryV2,
    abi: COSELL_REGISTRY_V2_ABI,
    functionName: "getListing",
    args: [listingId],
  });
  return {
    productId: result.productId,
    registrant: result.registrant,
    recipients: result.recipients,
    shares: result.shares.map((s) => Number(s)),
    currency: result.currency,
    registeredAt: result.registeredAt,
    active: result.active,
  };
}

/**
 * Compute the per-recipient PYUSD (or any ERC-20) amount for a listing's split
 * of `grossAmount` smallest units. Last recipient absorbs rounding dust so
 * `sum(perRecipient) === grossAmount` by construction.
 */
export async function computeSplit(
  grossAmount: bigint,
  listingId: Hex,
): Promise<readonly bigint[]> {
  const client = publicArbSepolia();
  return client.readContract({
    address: MESH_ARBITRUM_SEPOLIA.cosellRegistryV2,
    abi: COSELL_REGISTRY_V2_ABI,
    functionName: "computeSplit",
    args: [grossAmount, listingId],
  });
}
