import { env } from "cloudflare:workers";
import { headers } from "next/headers";
import { getRawDb } from "@/db";
import { canEditRoomDefaults } from "./calculator-defaults";
import { readRoomDefaults } from "./calculator-settings-store";

export async function getCalculatorAccess() {
  const requestHeaders = await headers();
  const id = requestHeaders.get("oai-authenticated-user-id");
  const email = requestHeaders.get("oai-authenticated-user-email");
  const identity = id && email ? { id, email } : null;
  return {
    identity,
    canEdit: canEditRoomDefaults(identity, env.CALCULATOR_ADMIN_EMAIL),
  };
}

export async function getCalculatorDefaults() {
  return readRoomDefaults(getRawDb());
}
