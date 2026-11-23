import { LANGS } from "@/lib/t";
import { ORIGIN } from "@/lib/site";
const PAGES = ["", "/programs", "/about", "/visit", "/faq"];
export default function sitemap() {
  return LANGS.flatMap((l) =>
    PAGES.map((p) => ({
      url: `${ORIGIN}/${l}${p}`,
      lastModified: new Date(),
      alternates: { languages: Object.fromEntries(LANGS.map((x) => [x, `${ORIGIN}/${x}${p}`])) },
    }))
  );
}
