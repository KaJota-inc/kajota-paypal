import type { Hex } from "viem";
import type { MeshListingTuple } from "@/lib/ap2/mesh-projection";
import type { BeaconReceipt } from "@/lib/beacon";

/**
 * A `Session` is one PayPal order's lifecycle through the Mesh pipeline, as
 * seen by the merchant dashboard. Row-shaped: one per settled order. All
 * amounts are in the token's minor units (6 decimals for PYUSD / USDC / USDG).
 */
export type SettlementStatus =
  | "pending-register"
  | "pending-deposit"
  | "pending-release"
  | "released"
  | "refunded"
  | "failed";

export type SessionRecipient = {
  role: "merchant" | "agent" | "affiliate" | "platform" | "referrer";
  address: string;
  shareBps: number;
  payoutMinorUnits: string; // bigint serialised as a decimal string
};

export type Session = {
  paymentMandateId: string;
  paypalOrderId: string;
  cartMandateHash: string;
  paymentMandateContentsHash: string;
  listingId?: Hex;
  depositId?: Hex;
  registerTxHash?: Hex;
  approveTxHash?: Hex;
  depositTxHash?: Hex;
  releaseTxHash?: Hex;
  grossAmountMinorUnits: string; // bigint serialised
  currency: string;
  merchantName: string;
  recipients: SessionRecipient[];
  status: SettlementStatus;
  createdAt: string;
  updatedAt: string;
  errorReason?: string;
  /**
   * Compliance-replay receipt from the Mandate Beacon layer. Computed off
   * the AP2 Mandate pair at ingest; byte-identical to the on-chain
   * commitment MandateAnchor would emit. Absent until Beacon is wired
   * in a given flow; the inspector route reads it off the Session.
   */
  beaconReceipt?: BeaconReceipt;
};

export interface SessionStore {
  put(session: Session): Promise<void>;
  get(paymentMandateId: string): Promise<Session | undefined>;
  list(): Promise<Session[]>;
  patch(
    paymentMandateId: string,
    patch: Partial<Session>,
  ): Promise<Session | undefined>;
  clear(): Promise<void>;
}

/**
 * In-process store for Phase A — survives within one Next.js server runtime
 * but not across cold starts. Phase B swaps for Vercel KV so dedupe +
 * dashboard rows survive deploys. Behind an interface so the swap is a
 * one-line change at the module boundary.
 */
class InMemorySessionStore implements SessionStore {
  private readonly items = new Map<string, Session>();

  async put(session: Session): Promise<void> {
    this.items.set(session.paymentMandateId, session);
  }

  async get(paymentMandateId: string): Promise<Session | undefined> {
    return this.items.get(paymentMandateId);
  }

  async list(): Promise<Session[]> {
    return [...this.items.values()].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
  }

  async patch(
    paymentMandateId: string,
    patch: Partial<Session>,
  ): Promise<Session | undefined> {
    const existing = this.items.get(paymentMandateId);
    if (!existing) return undefined;
    const next: Session = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.items.set(paymentMandateId, next);
    return next;
  }

  async clear(): Promise<void> {
    this.items.clear();
  }
}

/**
 * Module-level singleton so API routes share state across requests inside
 * one runtime instance.
 */
export const sessions: SessionStore = new InMemorySessionStore();

/**
 * Convenience helper for projecting a settled `MeshListingTuple` into the
 * row-shaped recipient array the dashboard renders.
 */
export function recipientsFromProjection(
  projection: MeshListingTuple,
  perRecipient: readonly bigint[],
): SessionRecipient[] {
  const roleFor = (index: number): SessionRecipient["role"] => {
    if (index === projection.roleIndex.merchant) return "merchant";
    if (index === projection.roleIndex.agent) return "agent";
    if (index === projection.roleIndex.affiliate) return "affiliate";
    return "platform";
  };
  return projection.recipients.map((address, i) => ({
    role: roleFor(i),
    address,
    shareBps: projection.shares[i] ?? 0,
    payoutMinorUnits: (perRecipient[i] ?? BigInt(0)).toString(),
  }));
}
