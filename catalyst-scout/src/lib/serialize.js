// Prisma `BigInt` (mis. TenderResult.budgetEstimated) gak bisa langsung lewat JSON.stringify/NextResponse.json
export function toJSONSafe(value) {
  return JSON.parse(JSON.stringify(value, (_key, val) => (typeof val === "bigint" ? val.toString() : val)));
}
