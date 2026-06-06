import { lookupAddressByZip } from "@/shared/lib/zipcode";

/** GET /api/zipcode?code=1600023 → { address } | { error } */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code") ?? "";

  const result = await lookupAddressByZip(code);
  const status = "error" in result ? 400 : 200;
  return Response.json(result, { status });
}
