"use client";
import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, ArrowRight, MessageSquare, MessageCircle, X } from "lucide-react";
import { Reveal } from "./Reveal";
import { QrCode } from "@/components/QrCode";

const SUPPORT_PHONE = "+224621003302";

export function AboutCtaFooter() {
  const [shareOpen, setShareOpen] = useState(false);

  const getLink = () => (typeof window !== "undefined" ? `${window.location.origin}/decouvrir` : "/decouvrir");
  const message = () => `Découvre N'ma SIM : ${getLink()}`;

  return (
    <>
      {/* ── À propos ── */}
      <section id="a-propos" className="py-20 md:py-24" style={{ background: "#F4F7FC" }}>
        <Reveal className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-5" style={{ fontFamily: "var(--font-headline)" }}>À propos de <span className="text-accent">N&apos;ma SIM</span></h2>
          <p className="text-text-muted text-lg leading-relaxed">
            N&apos;ma SIM est développé par une équipe technique basée en Guinée, avec un objectif simple :
            rapprocher les services SIM des populations, en combinant intelligence artificielle,
            accessibilité linguistique et autonomie matérielle — sans dépendre uniquement des agences physiques.
          </p>
        </Reveal>
      </section>

      {/* ── CTA final ── */}
      <section
        id="contact"
        data-navbar-invert="true"
        className="py-24 md:py-28 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2656A2 0%, #2656A2 55%, #F5BB02 100%)" }}
      >
        <Reveal className="relative max-w-2xl mx-auto px-5 sm:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-10 leading-tight" style={{ fontFamily: "var(--font-headline)" }}>
            Et si les services SIM étaient accessibles autrement&nbsp;?
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link
              href="/borne/accueil"
              className="inline-flex items-center gap-2 justify-center rounded-xl bg-accent text-primary font-semibold text-sm h-12 px-6 hover:brightness-95 transition-[filter] w-full sm:w-auto"
            >
              Découvrir N&apos;ma SIM <ArrowRight size={16} />
            </Link>
            <a
              href="mailto:support.nmasim@gmail.com"
              className="inline-flex items-center gap-2 justify-center rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-sm h-12 px-6 hover:bg-white/15 transition-colors w-full sm:w-auto"
            >
              Nous contacter
            </a>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-8 text-white/60 text-sm font-medium mb-12">
            <a href="mailto:support.nmasim@gmail.com" className="flex items-center gap-2 hover:text-white transition-colors">
              <Mail size={15} /> support.nmasim@gmail.com
            </a>
            <a href="tel:+224621003302" className="flex items-center gap-2 hover:text-white transition-colors">
              <Phone size={15} /> +224 621 00 33 02
            </a>
          </div>

          <div className="flex flex-col items-center">
            <p className="text-white/60 text-xs font-semibold mb-3">Scannez pour ouvrir sur votre téléphone</p>
            <button
              onClick={() => setShareOpen(true)}
              className="bg-white border border-white/20 rounded-2xl p-3 inline-block hover:brightness-95 transition-[filter] cursor-pointer"
              aria-label="Autres moyens de recevoir le lien"
            >
              <QrCode path="/decouvrir" size={120} alt="QR Code N'ma SIM" />
            </button>
            <p className="text-white/40 text-xs mt-3">ou cliquez pour recevoir le lien autrement</p>
          </div>
        </Reveal>
      </section>

      {shareOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center px-5"
          onClick={() => setShareOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShareOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-primary transition-colors"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-primary mb-1" style={{ fontFamily: "var(--font-headline)" }}>
              Recevoir le lien
            </h3>
            <p className="text-text-muted text-sm mb-5">Choisissez comment recevoir le lien vers N&apos;ma SIM.</p>

            <div className="flex flex-col gap-2">
              <a
                href={`sms:${SUPPORT_PHONE}?body=${encodeURIComponent(message())}`}
                className="flex items-center gap-3 rounded-xl border border-border-light p-3.5 hover:border-primary/30 hover:shadow-md transition-all duration-200"
              >
                <span className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={18} className="text-primary" />
                </span>
                <span className="text-sm font-semibold text-primary">Par SMS</span>
              </a>
              <a
                href={`tel:${SUPPORT_PHONE}`}
                className="flex items-center gap-3 rounded-xl border border-border-light p-3.5 hover:border-primary/30 hover:shadow-md transition-all duration-200"
              >
                <span className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0">
                  <Phone size={18} className="text-primary" />
                </span>
                <span className="text-sm font-semibold text-primary">Par appel téléphonique</span>
              </a>
              <a
                href={`https://wa.me/${SUPPORT_PHONE.replace("+", "")}?text=${encodeURIComponent(message())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-border-light p-3.5 hover:border-primary/30 hover:shadow-md transition-all duration-200"
              >
                <span className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={18} className="text-primary" />
                </span>
                <span className="text-sm font-semibold text-primary">Par WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer data-navbar-invert="true" className="bg-primary py-8">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/50 text-sm font-semibold text-center sm:text-left">
            N&apos;ma SIM — Votre SIM, en toute simplicité.
          </p>
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} N&apos;ma SIM. Tous droits réservés.
          </p>
        </div>
      </footer>
    </>
  );
}
