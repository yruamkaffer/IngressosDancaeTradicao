export function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function relationLabel(value: { label?: string | null } | Array<{ label?: string | null }> | null | undefined) {
  return firstRelation(value)?.label ?? "";
}

export function relationTicketCode(
  value: { ticket_code?: string | null } | Array<{ ticket_code?: string | null }> | null | undefined
) {
  return firstRelation(value)?.ticket_code ?? null;
}
