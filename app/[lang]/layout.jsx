import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import "../globals.css";
import { LANGS, isLang, makeT } from "@/lib/t";
import { resolveLayout, resolvePalette } from "@/lib/layout";
import { site, val, ORIGIN, INDEXABLE } from "@/lib/site";

/**
 * THIS IS THE ROOT LAYOUT AND IT LIVES INSIDE [lang] ON PURPOSE.
 * Trip2's bug, paid for and never to be repeated: app/layout.jsx hardcoded
 * lang="en", so every /es, /fr and /de page shipped as English in the SERVER
 * HTML and was patched afterwards by an inline script. Google and the AI
 * crawlers read the server HTML. A nested layout cannot own <html>, so the only
 * real fix is a [lang] root segment - which is what this is, from day one.
 */
/**
 * MOTION FOR PHONES THAT CANNOT DO IT IN CSS.
 * caniuse, opened 2026-11-24: animation-timeline:view() landed in iOS Safari
 * 26.0. Anything older - which is most iPhones in a parent's hand right now -
 * gets no scroll motion from the CSS path, so this supplies it.
 *
 * IT CANNOT BLANK THE PAGE. That is the whole design, and it is the lesson
 * from his 13:51 screenshots written into code:
 *   1. It hides nothing up front. It builds the observer FIRST.
 *   2. Only when the observer has actually fired - proof it works on this
 *      browser - does it hide anything, and then only elements that are
 *      OFF SCREEN at that instant.
 *   3. CSS keyframe rvFailsafe forces any hidden element visible after 5s
 *      with no script involved at all.
 * If any step fails, the page is simply the page, fully visible.
 */
const REVEAL = `(function(){try{
 if(window.CSS&&CSS.supports&&CSS.supports("animation-timeline","view()"))return;
 if(!("IntersectionObserver"in window))return;
 var SEL="#programs .card,.why-grid .wcard,#locations .card,.facts,.faq__item,main section .head,.stats__grid,.creds .cred";
 function go(){
  var els=[].slice.call(document.querySelectorAll(SEL));
  if(!els.length)return;
  var armed=false;
  var io=new IntersectionObserver(function(entries){
   if(!armed){
    armed=true;
    /* MEASURED 2026-11-24 at 390px: deciding this from e.isIntersecting
       left ONE card hidden while it sat on screen, because the observer
       had a negative bottom rootMargin. The rect is the only honest test:
       hide ONLY what is strictly below the fold. */
    var vh=window.innerHeight||0;
    els.forEach(function(el){
     if(el.getBoundingClientRect().top>=vh)el.classList.add("rv-el");
    });
    document.documentElement.setAttribute("data-rv","on");
    return;
   }
   entries.forEach(function(e){
    if(e.isIntersecting){e.target.classList.add("rv-in");io.unobserve(e.target);}
   });
  },{rootMargin:"0px",threshold:0.01});
  els.forEach(function(el){io.observe(el);});
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",go);else go();
}catch(e){try{document.documentElement.removeAttribute("data-rv");}catch(x){}}})();`;


/**
 * THE FACTS BAND SLIDES ON ITS OWN, AND THE FINGER WINS.
 * His word 2026-11-24: "This should be sliding on its own, and if somebody
 * just touch it and slide it, it goes."
 *
 * It is pure enhancement and CANNOT break the page: the band is already a
 * working scroll-snap slider in CSS alone. If this script never runs, the
 * parent simply swipes it themselves. Nothing is ever hidden by it.
 *
 * Touch, drag, wheel, keyboard or focus pauses it for 7s so it never fights
 * the person's finger, and a hidden tab pauses it completely.
 */
const FACTS_SLIDER = `(function(){try{
 function go(){
  var t=document.querySelector(".facts"); if(!t)return;
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  var paused=false,timer;
  function hold(){paused=true;clearTimeout(timer);timer=setTimeout(function(){paused=false;},7000);}
  ["pointerdown","touchstart","wheel","keydown","focusin","mouseenter"].forEach(function(ev){
   t.addEventListener(ev,hold,{passive:true});});
  setInterval(function(){
   if(paused||document.hidden)return;
   if(!window.matchMedia("(max-width:899px)").matches)return;   // desktop is a grid
   var room=t.scrollWidth-t.clientWidth; if(room<10)return;      // nothing to slide
   if(t.scrollLeft>=room-4){t.scrollTo({left:0,behavior:"smooth"});return;}
   var tl=t.getBoundingClientRect().left,next=null;
   for(var i=0;i<t.children.length;i++){
    var d=t.children[i].getBoundingClientRect().left-tl;
    if(d>6){next=d;break;}
   }
   t.scrollTo({left: next===null?0:t.scrollLeft+next, behavior:"smooth"});
  },4200);
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",go);else go();
}catch(e){}})();`;

export function generateStaticParams() { return LANGS.map((lang) => ({ lang })); }

export async function generateMetadata({ params }) {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = makeT(lang);
  const area = val(site.campuses[0]?.city) || "North Carolina";
  return {
    title: {
      default: t("{name} — Licensed Preschool and Childcare in {area}", { name: site.brand.name, area }),
      template: `%s — ${site.brand.name}`,
    },
    description: t(
      "Licensed preschool and childcare in {area}. Infants through after-school. Book a tour and talk to the school directly.",
      { area }
    ),
    metadataBase: new URL(ORIGIN),
    alternates: {
      canonical: `/${lang}`,
      languages: Object.fromEntries(LANGS.map((l) => [l, `/${l}`])),
    },
    robots: INDEXABLE ? undefined : { index: false, follow: false },
    openGraph: { type: "website", locale: lang, siteName: site.brand.name },
  };
}

export default async function RootLayout({ children, params }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const h = await headers();
  const c = await cookies();
  const layout = resolveLayout(h.get("x-bf-layout") || c.get("bf_layout")?.value, site.brand.layout);
  const palette = resolvePalette(h.get("x-bf-palette") || c.get("bf_palette")?.value, site.brand.palette);
  return (
    <html lang={lang} data-layout={layout} data-palette={palette}>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        {children}
        <script dangerouslySetInnerHTML={{ __html: REVEAL }} />
        <script dangerouslySetInnerHTML={{ __html: FACTS_SLIDER }} />
      </body>
    </html>
  );
}
