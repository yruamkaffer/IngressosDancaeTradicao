import { NextResponse } from "next/server";
import { eventConfig } from "@/config/event";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const requiredEnvNames = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_PASSWORD",
  "NEXT_PUBLIC_SITE_URL"
];

function envStatus() {
  return requiredEnvNames.map((name) => ({
    name,
    configured: Boolean(process.env[name])
  }));
}

export async function GET() {
  const env = envStatus();
  const missingEnv = env.filter((item) => !item.configured).map((item) => item.name);

  if (missingEnv.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        env,
        missingEnv,
        supabase: {
          ok: false,
          error: "Configure as variaveis de ambiente faltantes na Vercel e faca redeploy."
        }
      },
      { status: 500 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("seats")
      .select("id", { count: "exact" })
      .eq("event_id", eventConfig.id)
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          env,
          missingEnv: [],
          supabase: {
            ok: false,
            error: error.message
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      env,
      missingEnv: [],
      supabase: {
        ok: true,
        eventId: eventConfig.id,
        seatsQueryReturned: data?.length ?? 0
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        env,
        missingEnv: [],
        supabase: {
          ok: false,
          error: error instanceof Error ? error.message : "Erro desconhecido."
        }
      },
      { status: 500 }
    );
  }
}
