"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut, Building2 } from "lucide-react";

/**
 * Espace partenaire (hôtels / agences) : accès limité aux réservations SIM du partenaire.
 * Connexion via /admin/login ; un compte non PARTENAIRE est renvoyé vers l'administration.
 */
export default function PartenaireLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<{ name?: string; partenaireNom?: string } | null>(null);

  useEffect(() => {
    let s: { role?: string; name?: string; partenaireNom?: string } | null = null;
    try { s = JSON.parse(localStorage.getItem("admin_session") || "null"); } catch { s = null; }
    if (!s) { router.replace("/admin/login"); return; }
    if (s.role !== "PARTENAIRE") { router.replace("/admin"); return; }
    setSession(s);
  }, [router]);

  const deconnexion = () => {
    localStorage.removeItem("admin_session");
    router.replace("/admin/login");
  };

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F4F6FB] text-primary font-semibold">Vérification des accès...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F4F6FB]">
      <header className="bg-white border-b border-gray-100 print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Image src="/logo-final.png" alt="N'ma SIM" width={150} height={45} className="h-10 w-auto" />
          <div className="hidden sm:block h-8 w-px bg-gray-200" />
          <div className="flex items-center gap-2 text-primary">
            <Building2 className="w-5 h-5" />
            <div>
              <p className="text-[11px] uppercase tracking-wide text-text-muted leading-none">Espace partenaire</p>
              <p className="font-bold leading-tight">{session.partenaireNom || "Partenaire"}</p>
            </div>
          </div>
          <button onClick={deconnexion} className="ml-auto flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-primary">
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
