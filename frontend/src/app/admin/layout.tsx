"use client";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useState, Suspense, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { AdminAgentIA } from "@/components/admin/AdminAgentIA";
import "./admin-responsive.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoginPage) {
      const session = localStorage.getItem("admin_session");
      if (!session) {
        router.push("/admin/login");
      } else {
        setAuthorized(true);
      }
    } else {
      setAuthorized(true);
    }
  }, [pathname, isLoginPage, router]);

  useEffect(() => {
    const handleAdminAction = (e: any) => {
      if (e.detail?.action === "refresh") {
        window.location.reload();
      }
    };
    document.addEventListener("admin-ai-action", handleAdminAction);
    return () => document.removeEventListener("admin-ai-action", handleAdminAction);
  }, []);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!authorized) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#F4F6FB", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ color: "#1F0270", fontWeight: 600, fontSize: 16 }}>Vérification des accès...</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F4F6FB" }}>
      {/* Mobile overlay */}
      <div
        className={`admin-sidebar-overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
        style={{ display: "none" }}
      />

      {/* Mobile hamburger button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          display: "none",
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 101,
          background: "#1F0270",
          color: "white",
          border: "none",
          borderRadius: 10,
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(31,2,112,0.3)"
        }}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <Suspense fallback={<div style={{ width: 220, background: "#1F0270", minHeight: "100vh" }} />}>
          <AdminSidebar />
        </Suspense>
      </div>

      <main
        className="admin-main"
        style={{
          flex: 1,
          marginLeft: 250,
          maxWidth: "calc(100vw - 250px)",
          padding: "32px 28px",
          overflowX: "hidden",
          position: "relative"
        }}
      >
        {children}
      </main>

      {/* Copilote IA Administrateur */}
      <AdminAgentIA />
    </div>
  );
}
