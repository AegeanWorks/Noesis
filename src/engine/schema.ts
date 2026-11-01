import { z } from "zod";
import type { SessionAction, SessionConfig } from "./types";

export const MechanicIdSchema = z.enum(["nback", "gonogo", "reasoning"]);

export const BlockConfigSchema = z.object({
  mechanic: MechanicIdSchema,
  difficulty: z.number().int().min(1).max(3),
  trials: z.number().int().min(1).max(80),
});

export const SessionConfigSchema = z.object({
  seed: z.number().int(),
  label: z.string().min(1).max(80),
  blocks: z.array(BlockConfigSchema).min(1).max(6),
});

export const SessionActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("begin") }),
  z.object({ type: z.literal("advance"), ms: z.number().int().min(0).max(10_000) }),
  z.object({ type: z.literal("respond") }),
  z.object({ type: z.literal("answer"), option: z.number().int().min(0).max(3) }),
  z.object({ type: z.literal("next") }),
  z.object({ type: z.literal("abort") }),
]);

export const SessionActionListSchema = z.array(SessionActionSchema).max(20_000);

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

function message(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join(".") || "value"}: ${issue.message}`).join("; ");
}

export function parseConfig(value: unknown): ParseResult<SessionConfig> {
  const result = SessionConfigSchema.safeParse(value);
  return result.success
    ? { ok: true, value: result.data as SessionConfig }
    : { ok: false, error: message(result.error) };
}

export function parseAction(value: unknown): ParseResult<SessionAction> {
  const result = SessionActionSchema.safeParse(value);
  return result.success
    ? { ok: true, value: result.data as SessionAction }
    : { ok: false, error: message(result.error) };
}

export function parseActions(value: unknown): ParseResult<SessionAction[]> {
  const result = SessionActionListSchema.safeParse(value);
  return result.success
    ? { ok: true, value: result.data as SessionAction[] }
    : { ok: false, error: message(result.error) };
}
