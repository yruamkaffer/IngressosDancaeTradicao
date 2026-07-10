import { NextResponse } from "next/server";
import { eventConfig } from "@/config/event";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const diagnosticVersion = "health-2026-06-26-1345";

const requiredEnvNames = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_PASSWORD",
  "GATE_API_KEY",
  "NEXT_PUBLIC_SITE_URL"
];

function envValue(name: string) {
  return process.env[name]?.trim() ?? "";
}

function envStatus() {
  return requiredEnvNames.map((name) => {
    const raw = process.env[name];
    const trimmed = raw?.trim() ?? "";

    return {
      name,
      configured: Boolean(trimmed),
      hasPadding: Boolean(raw && raw !== trimmed)
    };
  });
}

function supabaseHost() {
  const url = envValue("NEXT_PUBLIC_SUPABASE_URL");
  if (!url) {
    return null;
  }

  try {
    return new URL(url).host;
  } catch {
    return "URL invalida";
  }
}

function describeCause(cause: unknown): unknown {
  if (!cause) {
    return undefined;
  }

  if (cause instanceof Error) {
    return {
      name: cause.name,
      message: cause.message,
      cause: describeCause(cause.cause)
    };
  }

  if (typeof cause === "object") {
    const record = cause as Record<string, unknown>;
    return {
      code: record.code,
      errno: record.errno,
      syscall: record.syscall,
      address: record.address,
      port: record.port,
      message: record.message
    };
  }

  return String(cause);
}

function describeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      cause: describeCause(error.cause)
    };
  }

  return {
    name: "UnknownError",
    message: String(error)
  };
}

async function probeSupabaseRest() {
  const url = new URL("/rest/v1/seats", envValue("NEXT_PUBLIC_SUPABASE_URL"));
  url.searchParams.set("select", "id,sector");
  url.searchParams.set("event_id", `eq.${eventConfig.id}`);
  url.searchParams.set("limit", "1");

  const startedAt = Date.now();
  const response = await fetch(url.toString(), {
    cache: "no-store",
    headers: {
      apikey: envValue("SUPABASE_SERVICE_ROLE_KEY"),
      Authorization: `Bearer ${envValue("SUPABASE_SERVICE_ROLE_KEY")}`
    }
  });

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    durationMs: Date.now() - startedAt
  };
}

export async function GET() {
  const env = envStatus();
  const missingEnv = env.filter((item) => !item.configured).map((item) => item.name);

  const basePayload = {
    diagnosticVersion,
    env,
    missingEnv,
    supabase: {
      host: supabaseHost(),
      eventId: eventConfig.id
    }
  };

  if (missingEnv.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        ...basePayload,
        supabase: {
          ...basePayload.supabase,
          ok: false,
          error: "Configure as variaveis de ambiente faltantes na Vercel e faca redeploy."
        }
      },
      { status: 500 }
    );
  }

  try {
    const restProbe = await probeSupabaseRest();
    const supabase = getSupabaseAdmin();
    const { data, count, error } = await supabase
      .from("seats")
      .select("id, sector", { count: "exact" })
      .eq("event_id", eventConfig.id)
      .range(0, 999);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          ...basePayload,
          supabase: {
            ...basePayload.supabase,
            ok: false,
            restProbe,
            error: error.message
          }
        },
        { status: 500 }
      );
    }

    const sectorCounts = (data ?? []).reduce<Record<string, number>>((acc, seat) => {
      acc[seat.sector] = (acc[seat.sector] ?? 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      ok: true,
      ...basePayload,
      supabase: {
        ...basePayload.supabase,
        ok: true,
        restProbe,
        seatsExactCount: count ?? data?.length ?? 0,
        expectedSeats: 640,
        sectorCounts
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        ...basePayload,
        supabase: {
          ...basePayload.supabase,
          ok: false,
          error: describeError(error)
        }
      },
      { status: 500 }
    );
  }
}
