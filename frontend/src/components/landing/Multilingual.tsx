import { Mic, Brain, MessageCircle } from "lucide-react";
import { Reveal } from "./Reveal";

const LANGUES = [
  { code: "FR", label: "Français", flag: "🇫🇷" },
  { code: "SUS", label: "Soussou", flag: "🇬🇳" },
  { code: "POU", label: "Poular", flag: "🇬🇳" },
  { code: "MAL", label: "Malinké", flag: "🇬🇳" },
  { code: "EN", label: "English", flag: "🇬🇧" },
];

const FLOW = [
  { icon: Mic, title: "L'utilisateur parle" },
  { icon: Brain, title: "L'IA comprend" },
  { icon: MessageCircle, title: "N'ma SIM répond" },
];

export function Multilingual() {
  return (
    <section className="py-20 md:py-24" style={{ background: "#F4F7FC" }}>
      <div className="max-w-5xl mx-auto px-5 sm:px-8 text-center">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-3" style={{ fontFamily: "var(--font-headline)" }}>
            N&apos;ma SIM vous accompagne dans votre <span className="text-accent">langue.</span>
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto mb-12">
            Une interface et un assistant vocal pensés pour la diversité linguistique locale.
          </p>
        </Reveal>

        <Reveal stagger={0.06} className="flex flex-wrap items-center justify-center gap-3 mb-16">
          {LANGUES.map((l) => (
            <div
              key={l.code}
              className="flex items-center gap-2 bg-white border border-border-light rounded-full pl-2.5 pr-4 py-2 shadow-sm"
            >
              <span className="text-xl leading-none flex-shrink-0">{l.flag}</span>
              <span className="text-sm font-bold text-primary">{l.label}</span>
            </div>
          ))}
        </Reveal>

        <Reveal delay={0.1} className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          {FLOW.map(({ icon: Icon, title }, i) => (
            <div key={title} className="flex items-center gap-4 sm:gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-primary">
                  <Icon size={24} className="text-accent" />
                </div>
                <span className="text-xs font-bold text-primary max-w-[100px]">{title}</span>
              </div>
              {i < FLOW.length - 1 && <div className="hidden sm:block w-10 h-px bg-border-light" />}
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
