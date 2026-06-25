import { ADMIN_COOKIE_NAME, adminSessionValue, isAdminPassword } from "@/lib/admin-auth";
import { fail, ok } from "@/lib/api";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  try {
    if (!isAdminPassword(password)) {
      return fail("Senha administrativa invalida.", 401);
    }

    const response = ok({ loggedIn: true });
    response.cookies.set(ADMIN_COOKIE_NAME, adminSessionValue(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8
    });

    return response;
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Nao foi possivel validar a senha administrativa.",
      500
    );
  }
}
