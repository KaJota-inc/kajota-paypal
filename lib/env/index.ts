import { z } from "zod";

const serverSchema = z.object({
  PAYPAL_CLIENT_ID: z.string().min(1),
  PAYPAL_CLIENT_SECRET: z.string().min(1),
  PAYPAL_ENV: z.enum(["sandbox", "live"]).default("sandbox"),
  PAYPAL_WEBHOOK_ID: z.string().optional(),
  PAYPAL_MCP_URL: z.string().url().optional(),

  AP2_ISSUER_DID: z.string().optional(),
  AP2_ISSUER_PRIVATE_KEY: z.string().optional(),
  AP2_VERIFY_SKEW_SECONDS: z.coerce.number().int().positive().default(300),

  CHANNEL3_API_KEY: z.string().min(1),
  CHANNEL3_BASE_URL: z.string().url().default("https://api.trychannel3.com/v1"),

  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default("gpt-4.1"),

  ARBITRUM_SEPOLIA_RPC_URL: z
    .string()
    .url()
    .default("https://sepolia-rollup.arbitrum.io/rpc"),
  ARBITRUM_SEPOLIA_EXPLORER_URL: z
    .string()
    .url()
    .default("https://sepolia.arbiscan.io"),
  MESH_RELEASE_AUTH_PRIVATE_KEY: z.string().optional(),
  MESH_ORCHESTRATION_PRIVATE_KEY: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_CHAIN_ID: z.coerce.number().int().positive().default(421614),
  NEXT_PUBLIC_EXPLORER_URL: z
    .string()
    .url()
    .default("https://sepolia.arbiscan.io"),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

let _serverEnv: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() must only be called on the server");
  }
  if (_serverEnv) return _serverEnv;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    throw new Error(
      `Invalid server environment:\n${JSON.stringify(flattened.fieldErrors, null, 2)}`
    );
  }
  _serverEnv = parsed.data;
  return _serverEnv;
}

export const clientEnv: ClientEnv = clientSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
  NEXT_PUBLIC_EXPLORER_URL: process.env.NEXT_PUBLIC_EXPLORER_URL,
});
