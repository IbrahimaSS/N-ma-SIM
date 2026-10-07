"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "#solution", label: "Solution" },
  { href: "#services", label: "Services" },
  { href: "#comment-ca-marche", label: "Comment ça marche" },
  { href: "#securite", label: "Sécurité" },
  { href: "#borne", label: "La borne" },
  { href: "#operateurs", label: "Opérateurs" },
  { href: "#a-propos", label: "À propos" },
];

const HEADER_HEIGHT = 80;

export function LandingHeader() {
  const [overDark, setOverDark] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const check = () => {
      setScrolled(window.scrollY > 12);

      const darkSections = document.querySelectorAll<HTMLElement>('[data-navbar-invert="true"]');
      let isDark = false;
      darkSections.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= HEADER_HEIGHT && rect.bottom >= 0) isDark = true;
      });
      setOverDark(isDark);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        overDark ? "bg-white/95 backdrop-blur-xl" : "bg-primary"
      } ${scrolled ? "shadow-[0_8px_30px_rgba(31,2,112,0.2)]" : ""}`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-20 flex items-center justify-between">
        <Link href="/decouvrir" className="flex items-center shrink-0">
          {overDark ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/logo-final.png" alt="N'ma SIM" className="h-12 w-auto" />
          ) : (
            <div className="bg-white rounded-xl px-3 py-2 flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-final.png" alt="N'ma SIM" className="h-9 w-auto" />
            </div>
          )}
        </Link>

        <nav className="hidden lg:flex items-center gap-5 xl:gap-6">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`relative text-[15px] font-semibold py-1 transition-colors group ${
                overDark ? "text-text-main/75 hover:text-primary" : "text-white/80 hover:text-white"
              }`}
            >
              {l.label}
              <span
                className={`absolute left-0 -bottom-0.5 h-[2px] w-0 group-hover:w-full transition-all duration-300 ${
                  overDark ? "bg-primary" : "bg-accent"
                }`}
              />
            </a>
          ))}
        </nav>

        <div className="hidden lg:block">
          <a
            href="#contact"
            className="inline-flex items-center justify-center rounded-xl bg-accent text-primary text-sm font-semibold h-10 px-5 hover:brightness-95 transition-[filter]"
          >
            Nous contacter
          </a>
        </div>

        <button
          className={`lg:hidden p-2 -mr-2 transition-colors ${overDark ? "text-primary" : "text-white"}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Ouvrir le menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-border-light shadow-lg">
          <nav className="flex flex-col px-5 py-4 gap-1">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="py-2.5 text-sm font-semibold text-text-main/80 hover:text-primary transition-colors"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setMenuOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-primary text-white text-sm font-bold px-5 py-3"
            >
              Nous contacter
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
