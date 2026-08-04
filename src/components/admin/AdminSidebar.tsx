"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, FileText, CreditCard, Users, Tag,
  UserCog, ScrollText, Settings, LogOut, ChevronRight, User
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/admin/demandes-sim", label: "Demandes SIM", icon: FileText },
  { href: "/admin/paiements", label: "Paiements", icon: CreditCard },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/offres", label: "Offres", icon: Tag },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: UserCog },
  { href: "/admin/logs", label: "Logs & Historique", icon: ScrollText },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings },
  { href: "/admin?tab=profil", label: "Mon profil", icon: User },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams ? searchParams.get("tab") : null;

  const isActive = (href: string, exact?: boolean) => {
    if (href.includes("?tab=profil")) {
      return pathname === "/admin" && activeTab === "profil";
    }
    if (exact) {
      return pathname === href && !activeTab;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      background: "#1F0270",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      padding: "0",
      position: "fixed",
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{
        padding: "28px 20px 24px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            background: "white",
            borderRadius: 10,
            width: 44,
            height: 44,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <img src="/logo-transparent.png" alt="N'ma SIM" style={{ width: "160%", transform: "scale(1.3)" }} />
          </div>
          <div>
            <div style={{ color: "white", fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>N'ma</div>
            <div style={{ color: "#FFB800", fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>SIM</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "16px 10px", overflowY: "auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "11px 14px",
                  borderRadius: 10,
                  textDecoration: "none",
                  background: active ? "rgba(255,184,0,0.15)" : "transparent",
                  color: active ? "#FFB800" : "rgba(255,255,255,0.7)",
                  fontWeight: active ? 600 : 400,
                  fontSize: 14,
                  transition: "all 0.2s",
                  border: active ? "1px solid rgba(255,184,0,0.25)" : "1px solid transparent",
                }}
              >
                <item.icon size={18} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {active && <ChevronRight size={14} style={{ opacity: 0.6 }} />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div style={{ padding: "12px 10px 20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <button
          onClick={() => {
            localStorage.removeItem("admin_session");
            router.push("/admin/login");
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "11px 14px",
            borderRadius: 10,
            background: "transparent",
            color: "rgba(255,255,255,0.5)",
            fontSize: 14,
            border: "none",
            cursor: "pointer",
            width: "100%",
            transition: "color 0.2s",
          }}
        >
          <LogOut size={18} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
