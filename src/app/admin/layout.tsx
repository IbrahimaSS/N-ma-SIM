import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F4F6FB", fontFamily: "'Inter', sans-serif" }}>
      <AdminSidebar />
      <main style={{
        marginLeft: 220,
        flex: 1,
        minHeight: "100vh",
        padding: "36px 32px",
        maxWidth: "calc(100vw - 220px)",
        overflowX: "hidden",
      }}>
        {/* Décoration jaune coin haut droit */}
        <div style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 180,
          height: 180,
          background: "radial-gradient(circle at top right, #FFB800 0%, transparent 70%)",
          opacity: 0.12,
          pointerEvents: "none",
          zIndex: 0,
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
