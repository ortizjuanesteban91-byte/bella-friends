import { site, ORIGIN } from "@/lib/site";
import { preschoolSchema } from "@/lib/schema";

/**
 * THIS COMPONENT DOES NOTHING BUT STRINGIFY. All of the judgement lives in
 * lib/schema.js, which is pure and tested in plain Node, so what the tests
 * prove is the code that ships and not a copy of it.
 */
export default function Schema({ lang }) {
  const n = preschoolSchema(site, lang, ORIGIN);
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(n) }} />;
}
