"use client";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import "./admin-responsive.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoginPage) {
    return <>{children}</>;
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
        <AdminSidebar />
      </div>

      {/* Main content */}
      <main
        className="admin-main"
        style={{
          flex: 1,
          marginLeft: 250,
          maxWidth: "calc(100vw - 250px)",
          padding: "32px 28px",
          overflowX: "hidden"
        }}
      >
        {children}
      </main>
    </div>
  );
}
