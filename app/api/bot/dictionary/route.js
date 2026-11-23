import { dictionary } from "@/lib/bot";
import { site } from "@/lib/site";
import { makeT, isLang } from "@/lib/t";

export const dynamic = "force-dynamic";

/**
 * The bot's whole dictionary, DERIVED from config/site.json on every request.
 * There is no generated file to go stale, so the page and the bot cannot drift.
 * This is also the export for any outside channel (WhatsApp, Orbilynk).
 */
export async function GET(req) {
  const lang = new URL(req.url).searchParams.get("lang");
  const l = isLang(lang) ? lang : "en";
  return Response.json(dictionary(makeT(l), site));
}
