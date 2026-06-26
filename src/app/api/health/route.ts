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

function supabaseHost() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    return null;
  }

  try {
    return new URL(url).host;
  } catch {
    return "URL invalida";
  }
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
          host: supabaseHost(),
          error: "Configure as variáveis de ambiente faltantes na Vercel e faça redeploy."
        }
      },
      { status: 500 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const { count, error } = await supabase
      .from("seats")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventConfig.id);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          env,
          missingEnv: [],
          supabase: {
            ok: false,
            host: supabaseHost(),
            eventId: eventConfig.id,
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
        host: supabaseHost(),
        eventId: eventConfig.id,
        seatsExactCount: count ?? 0,
        expectedSeats: 640
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
          host: supabaseHost(),
          eventId: eventConfig.id,
          error: error instanceof Error ? error.message : "Erro desconhecido."
        }
      },
      { status: 500 }
    );
  }
}