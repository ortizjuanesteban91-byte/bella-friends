import { val, filled } from "./facts.js";
import { addressOneLine } from "./schema.js";

/**
 * ONE FACT, ONE SOURCE — THE WHOLE POINT OF THIS FILE.
 * The FAQ page, the FAQPage schema and the BOT all call buildAnswers(). There is
 * no second copy, so the page and the bot physically cannot disagree.
 * Uvero Alto is why: the page read one list, the bot read another, and every
 * Uvero Alto guest was turned away.
 *
 * A question whose fact is not supplied returns a:null. It then shows as a
 * placeholder on the page, and the bot says "I do not know that yet — here is
 * how to reach the school." It NEVER invents one.
 *
 * PURE: takes the config in, so tests run it in plain Node.
 */
export function buildAnswers(t, site) {
  const phone = val(site.contact.phone);
  const email = val(site.contact.email);
  const addr = addressOneLine(site);
  const list = [];
  const add = (id, q, a, ask, keys) => list.push({ id, q, a: a || null, ask: ask || null, keys });

  add("ages", t("What ages do you take?"),
    t("We have {n} rooms.", { n: site.programs.length }) + " " +
      site.programs.map((p) => `${t(p.name)} (${t(p.ages)})`).join(", ") + ".",
    null, ["age", "ages", "old", "months", "years", "baby", "infant", "toddler", "pre k", "prek", "pre-k",
   "preschool", "pre school", "kindergarten", "after school", "afterschool", "school age", "aftercare",
   "room", "class for", "edad", "anos", "meses", "bebe", "parvulos", "guarderia", "despues de la escuela"]);

  add("licence", t("Are you licensed?"),
    filled(site.trust.licence)
      ? t("Yes. Licensed by the North Carolina Division of Child Development and Early Education. Licence number {n}.", { n: val(site.trust.licence) })
      : null,
    site.trust.licence.ask,
    ["licen", "licence", "license", "registered", "legal", "licencia", "permiso"]);

  add("ratio", t("How many children to each teacher?"),
    filled(site.trust.ratios) ? val(site.trust.ratios) : null, site.trust.ratios.ask,
    ["ratio", "how many children", "class size", "teacher to", "staff", "proporcion", "ninos por"]);

  add("hours", t("What are your hours?"),
    filled(site.contact.hours) ? val(site.contact.hours) : null, site.contact.hours.ask,
    ["hour", "hours", "open", "close", "drop off", "pick up", "time", "horario", "abren", "cierran"]);

  add("where", t("Where are you?"),
    addr ? t("{campus}: {addr}", { campus: site.campuses[0].name, addr }) : null,
    site.campuses[0].street.ask,
    ["where", "address", "located", "location", "directions", "donde", "direccion", "ubicacion"]);

  add("cost", t("How much is it?"),
    site.tuition.showPrices && filled(site.tuition.from)
      ? val(site.tuition.from)
      : t("Tuition depends on the room and the days you need, so we give you the exact figure for your child rather than a range. Ask on the form or on the phone and you get it the same day."),
    null,
    ["cost", "price", "tuition", "fee", "how much", "rate", "weekly", "monthly", "expensive", "afford",
     "cheap", "cheaper", "discount", "sibling", "second child", "deal", "payment plan", "per week", "can you do", "cheapest", "best price", "lowest",
     "precio", "costo", "cuanto", "mensual", "caro", "barato", "descuento", "hermano", "hermanos"]);

  add("tour", t("Can I come and look round?"),
    t("Yes, and we would rather you did. A tour takes about twenty minutes and you meet the teacher who would have your child. Use the form, or call."),
    null, ["tour", "visit", "look round", "see the", "come in", "appointment", "visita", "recorrido", "ver la"]);

  add("contact", t("How do I reach a human?"),
    phone || email
      ? [phone && t("Call {phone}.", { phone }), email && t("Email {email}.", { email })].filter(Boolean).join(" ")
      : null,
    site.contact.phone.ask,
    ["call", "phone", "number", "email", "contact", "speak", "human", "talk", "telefono", "llamar", "correo", "hablar"]);

  add("waitlist", t("Do you have a place right now?"),
    t("Places open through the year and by room. Tell us your child's age and the month you need, and we will tell you straight away whether we have a place or a waiting list."),
    null, ["availab", "space", "place", "spot", "waitlist", "waiting list", "enroll", "enrol", "register", "cupo", "lugar", "inscrib", "lista de espera"]);

  add("food", t("Do you provide meals?"), null,
    "Does the school provide meals and snacks, or do parents send them? Any allergy policy to state?",
    ["food", "meal", "lunch", "snack", "breakfast", "allerg", "comida", "almuerzo", "merienda", "alergia"]);

  add("potty", t("Do you take children who are not potty trained?"), null,
    "Which rooms accept children who are not potty trained, and how does the school handle the transition?",
    ["potty", "diaper", "nappy", "toilet", "trained", "panal", "bano", "entrenamiento"]);

  add("sick", t("What happens if my child is ill?"), null,
    "The illness policy in one short paragraph: when a child must stay home, and when they can come back.",
    ["sick", "ill", "fever", "medicine", "covid", "keep her home", "keep him home", "stay home",
     "contagious", "vomit", "rash", "enferm", "fiebre", "medicina", "vomita", "contagio"]);

  return list;
}
