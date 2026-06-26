import { fail, ok } from "@/lib/api";
import { getEventSeatsWithEffectiveStatus } from "@/lib/seats";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const seats = await getEventSeatsWithEffectiveStatus();
    return ok({ seats });
  } catch (error) {
    return fail(
      "Nao foi possivel carregar os assentos.",
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
