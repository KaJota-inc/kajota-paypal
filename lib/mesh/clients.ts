import { createPublicClient, createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";
import { serverEnv } from "@/lib/env";

/**
 * Public (read-only) viem client for Arbitrum Sepolia.
 * Safe to call from server routes without any key material in scope.
 */
export function publicArbSepolia() {
  const env = serverEnv();
  return createPublicClient({
    chain: arbitrumSepolia,
    transport: http(env.ARBITRUM_SEPOLIA_RPC_URL),
  });
}

/**
 * The orchestration wallet — holds PYUSD and submits deposits on behalf of
 * PayPal-settled orders. Must be funded with testnet ETH for gas.
 */
export function orchestrationWallet() {
  const env = serverEnv();
  if (!env.MESH_ORCHESTRATION_PRIVATE_KEY) {
    throw new Error(
      "MESH_ORCHESTRATION_PRIVATE_KEY is not set; cannot call deposit()"
    );
  }
  const account = privateKeyToAccount(
    env.MESH_ORCHESTRATION_PRIVATE_KEY as Hex
  );
  return createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http(env.ARBITRUM_SEPOLIA_RPC_URL),
  });
}

/**
 * The release-auth wallet — the sole caller permitted by CosellEscrowV2's
 * `releaseAuth` role. The share table was fixed at deposit time, so this key
 * triggers settlement but cannot influence recipients or shares.
 */
export function releaseAuthWallet() {
  const env = serverEnv();
  if (!env.MESH_RELEASE_AUTH_PRIVATE_KEY) {
    throw new Error(
      "MESH_RELEASE_AUTH_PRIVATE_KEY is not set; cannot call release()"
    );
  }
  const account = privateKeyToAccount(
    env.MESH_RELEASE_AUTH_PRIVATE_KEY as Hex
  );
  return createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http(env.ARBITRUM_SEPOLIA_RPC_URL),
  });
}
