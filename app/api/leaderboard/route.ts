import { NextResponse } from "next/server";
import { sessions, type SessionRecipient } from "@/lib/orchestrator/sessions";

export const runtime = "nodejs";

type LeaderboardRow = {
  address: string;
  primaryRole: SessionRecipient["role"];
  roles: Record<SessionRecipient["role"], number>;
  earnedMinorUnits: string;
  settlementCount: number;
  lastSettledAt: string | null;
  streakDays: number;
};

const WINDOW_SECONDS: Record<string, number | null> = {
  "24h": 24 * 60 * 60,
  "7d": 7 * 24 * 60 * 60,
  "30d": 30 * 24 * 60 * 60,
  all: null,
};

const EMPTY_ROLES = {
  merchant: 0,
  agent: 0,
  affiliate: 0,
  platform: 0,
  referrer: 0,
} as const satisfies Record<SessionRecipient["role"], number>;

/**
 * GET /api/leaderboard?window=24h|7d|30d|all
 *
 * The Hustle Engine says "rank the hustlers — standing is a reward you don't
 * have to pay out in cash." For the agent-economy sell side that board is
 * exactly this: every address that has been paid through Mesh, ranked by
 * cumulative PYUSD earned over the chosen window, with role mix + streak
 * so a judge sees who is hustling and in what capacity.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const windowKey = url.searchParams.get("window") ?? "all";
  const windowSeconds = WINDOW_SECONDS[windowKey] ?? null;
  const now = Date.now();
  const cutoffMs = windowSeconds ? now - windowSeconds * 1000 : 0;

  const all = await sessions.list();
  const relevant = all.filter((s) => {
    if (!cutoffMs) return true;
    return new Date(s.updatedAt).getTime() >= cutoffMs;
  });

  const byAddress = new Map<string, {
    row: LeaderboardRow;
    daysWithSettlement: Set<string>;
  }>();

  for (const session of relevant) {
    for (const recipient of session.recipients) {
      const key = recipient.address.toLowerCase();
      const prior = byAddress.get(key);
      const row = prior?.row ?? {
        address: recipient.address,
        primaryRole: recipient.role,
        roles: { ...EMPTY_ROLES },
        earnedMinorUnits: "0",
        settlementCount: 0,
        lastSettledAt: null,
        streakDays: 0,
      };
      const daysSet = prior?.daysWithSettlement ?? new Set<string>();

      // Only count "released" rows as earned — a pending/failed row didn't
      // actually pay anyone. The Hustle Engine's own test: real gain, not
      // staged gain.
      if (session.status === "released") {
        const earned = safeBig(row.earnedMinorUnits) + safeBig(recipient.payoutMinorUnits);
        row.earnedMinorUnits = earned.toString();
        row.settlementCount += 1;
        row.roles[recipient.role] += 1;
        const dayKey = session.updatedAt.slice(0, 10);
        daysSet.add(dayKey);
        if (!row.lastSettledAt || row.lastSettledAt < session.updatedAt) {
          row.lastSettledAt = session.updatedAt;
        }
        // Primary role = the role that appeared most for this address.
        row.primaryRole = pickPrimaryRole(row.roles);
      }

      byAddress.set(key, { row, daysWithSettlement: daysSet });
    }
  }

  const rows = [...byAddress.values()]
    .map(({ row, daysWithSettlement }) => {
      row.streakDays = computeStreakDays(daysWithSettlement, now);
      return row;
    })
    .filter((row) => row.settlementCount > 0)
    .sort((a, b) => (safeBig(a.earnedMinorUnits) > safeBig(b.earnedMinorUnits) ? -1 : 1));

  return NextResponse.json({
    ok: true,
    window: windowKey,
    windowSeconds,
    computedAt: new Date(now).toISOString(),
    count: rows.length,
    rows,
  });
}

function pickPrimaryRole(
  roles: Record<SessionRecipient["role"], number>,
): SessionRecipient["role"] {
  const entries = Object.entries(roles) as [SessionRecipient["role"], number][];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? "merchant";
}

function safeBig(value: string): bigint {
  try {
    return value ? BigInt(value) : BigInt(0);
  } catch {
    return BigInt(0);
  }
}

function computeStreakDays(dayKeys: Set<string>, nowMs: number): number {
  if (dayKeys.size === 0) return 0;
  const sorted = [...dayKeys].sort((a, b) => (a > b ? -1 : 1));
  let streak = 0;
  let cursor = new Date(nowMs);
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (sorted[streak] === key) {
      streak += 1;
      cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
    } else {
      // Allow the trailing day to be yesterday rather than today (demo cadence)
      if (streak === 0) {
        const yesterday = new Date(nowMs - 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);
        if (sorted[0] === yesterday) {
          streak = 1;
          cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
          continue;
        }
      }
      break;
    }
  }
  return streak;
}
