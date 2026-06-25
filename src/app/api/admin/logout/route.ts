import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { ok } from "@/lib/api";

export async function POST() {
  const response = ok({ loggedIn: false });
  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });

  return response;
}
