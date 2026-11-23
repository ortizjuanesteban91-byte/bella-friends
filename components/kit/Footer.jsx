import { site, val } from "@/lib/site";
import { addressOneLine } from "@/lib/schema";
import F from "./Placeholder";

export default function Footer({ lang, t }) {
  const phone = val(site.contact.phone);
  const email = val(site.contact.email);
  return (
    <footer className="ftr">
      <div className="shell">
        <p>
          <strong>{site.brand.name}</strong> — {site.campuses[0]?.name}
          <br />
          {addressOneLine(site) || <F fact={site.campuses[0]?.street} />}
        </p>
        <p>
          {t("Phone")}: {phone ? <a href={`tel:${String(phone).replace(/[^+\d]/g, "")}`}>{phone}</a> : <F fact={site.contact.phone} />}
          <br />
          {t("Email")}: {email ? <a href={`mailto:${email}`}>{email}</a> : <F fact={site.contact.email} />}
          <br />
          {t("Hours")}: <F fact={site.contact.hours} />
        </p>
        <p>
          {t("Licensed by the North Carolina Division of Child Development and Early Education.")}{" "}
          {t("Licence number")}: <F fact={site.trust.licence} />
        </p>
        <p style={{ fontSize: ".82rem" }}>
          © {new Date().getFullYear()} {site.brand.name}. {t("Built by Orbilynk.")}
        </p>
      </div>
    </footer>
  );
}
