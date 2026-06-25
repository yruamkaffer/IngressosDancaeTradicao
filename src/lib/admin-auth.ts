import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "dance_ticket_admin";

function adminSecret() {
  const value = process.env.ADMIN_PASSWORD;
  if (!value) {
    throw new Error("Missing environment variable: ADMIN_PASSWORD");
  }
  return value;
}

export function adminSessionValue() {
  return createHmac("sha256", adminSecret())
    .update("dance-ticket-admin-session-v1")
    .digest("hex");
}

function safeCompare(a?: string, b?: string) {
  if (!a || !b) {
    return false;
  }

  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function isAdminPassword(password: string) {
  return safeCompare(password, adminSecret());
}

export function hasAdminSession() {
  const value = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!value) {
    return false;
  }

  return safeCompare(value, adminSessionValue());
}

export function requestHasAdminSession(request: NextRequest) {
  const value = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!value) {
    return false;
  }

  return safeCompare(value, adminSessionValue());
}

