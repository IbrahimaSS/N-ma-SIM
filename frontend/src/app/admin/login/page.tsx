"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, User, Shield, CheckCircle } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setIsLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, motDePasse: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Identifiants incorrects.");
        setIsLoading(false);
        return;
      }

      // Stocker le token JWT + infos utilisateur
      const adminSession = {
        token: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        id: data.data.user.id,
        name: data.data.user.nom,
        email: data.data.user.email,
        role: data.data.user.role,
        loginAt: new Date().toLocaleString("fr-FR", {
          day: "2-digit", month: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit", second: "2-digit"
        })
      };
      localStorage.setItem("admin_session", JSON.stringify(adminSession));

      setIsSuccess(true);
      setTimeout(() => router.push("/admin"), 1000);
    } catch (err) {
      console.error("[LOGIN]", err);
      setError("Impossible de joindre le serveur. Vérifiez que le backend est démarré.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeInScale {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes floatUpDown {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-12px); }
      }
      @keyframes pulseGlow {
        0%, 100% { box-shadow: 0 0 20px rgba(255, 184, 0, 0.15); }
        50% { box-shadow: 0 0 40px rgba(255, 184, 0, 0.35); }
      }
      @keyframes spinSlow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
      <div style={{
        minHeight: "100vh",
        display: "flex",
        fontFamily: "'Inter', sans-serif",
        background: "#F4F6FB"
      }}>
        {/* SECTION GAUCHE : Formulaire de connexion */}
        <div style={{
          flex: "1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 40px",
          background: "#FFFFFF",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Cercles décoratifs subtils en arrière-plan */}
          <div style={{
            position: "absolute",
            top: "-15%",
            left: "-8%",
            width: 350,
            height: 350,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(31, 2, 112, 0.04) 0%, transparent 70%)",
            pointerEvents: "none"
          }} />
          <div style={{
            position: "absolute",
            bottom: "-10%",
            right: "-5%",
            width: 250,
            height: 250,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255, 184, 0, 0.06) 0%, transparent 70%)",
            pointerEvents: "none"
          }} />

          <div style={{
            width: "100%",
            maxWidth: 460,
            position: "relative",
            zIndex: 10
          }}>
            {/* Logo / Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 48 }}>
              <div style={{
                background: "linear-gradient(135deg, #1F0270, #3B0CB8)",
                borderRadius: 14,
                padding: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(31, 2, 112, 0.2)"
              }}>
                <Shield size={26} style={{ color: "#FFB800" }} />
              </div>
              <div>
                <span style={{ fontSize: 20, fontWeight: 800, color: "#1F0270", letterSpacing: "-0.5px", display: "block" }}>N&apos;ma SIM</span>
                <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>Portail Administrateur</span>
              </div>
            </div>

            {/* Titre */}
            <div style={{ marginBottom: 36 }}>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: "#111827", margin: 0, marginBottom: 10, letterSpacing: "-0.5px" }}>Connexion</h1>
              <p style={{ color: "#6B7280", margin: 0, fontSize: 15, lineHeight: 1.5 }}>Connectez-vous à votre espace pour gérer la plateforme.</p>
            </div>

            {error && (
              <div style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 12,
                padding: "14px 18px",
                color: "#991B1B",
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                gap: 10
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#DC2626", flexShrink: 0 }} />
                {error}
              </div>
            )}

            {isSuccess ? (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px 0",
                gap: 16
              }}>
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "#ECFDF5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <CheckCircle size={36} style={{ color: "#10B981" }} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#10B981", marginBottom: 6 }}>Authentification réussie !</div>
                  <div style={{ fontSize: 14, color: "#6B7280" }}>Chargement de votre tableau de bord...</div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Champ Email */}
                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 10 }}>Adresse Email</label>
                  <div style={{ position: "relative" }}>
                    <User size={20} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@nmasim.gn"
                      style={{
                        width: "100%",
                        height: 56,
                        paddingLeft: 48,
                        paddingRight: 16,
                        borderRadius: 14,
                        border: "2px solid #E5E7EB",
                        fontSize: 15,
                        outline: "none",
                        background: "#FAFBFC",
                        color: "#111827",
                        boxSizing: "border-box",
                        transition: "all 0.25s ease",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#1F0270";
                        e.target.style.background = "#FFFFFF";
                        e.target.style.boxShadow = "0 0 0 4px rgba(31, 2, 112, 0.08)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#E5E7EB";
                        e.target.style.background = "#FAFBFC";
                        e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                      }}
                    />
                  </div>
                </div>

                {/* Champ Mot de passe */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <label style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Mot de passe</label>
                    <a href="#" style={{ fontSize: 13, color: "#1F0270", fontWeight: 600, textDecoration: "none" }}>Mot de passe oublié ?</a>
                  </div>
                  <div style={{ position: "relative" }}>
                    <Lock size={20} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Entrez votre mot de passe"
                      style={{
                        width: "100%",
                        height: 56,
                        paddingLeft: 48,
                        paddingRight: 48,
                        borderRadius: 14,
                        border: "2px solid #E5E7EB",
                        fontSize: 15,
                        outline: "none",
                        background: "#FAFBFC",
                        color: "#111827",
                        boxSizing: "border-box",
                        transition: "all 0.25s ease",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#1F0270";
                        e.target.style.background = "#FFFFFF";
                        e.target.style.boxShadow = "0 0 0 4px rgba(31, 2, 112, 0.08)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#E5E7EB";
                        e.target.style.background = "#FAFBFC";
                        e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: 16,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#9CA3AF",
                        display: "flex",
                        alignItems: "center",
                        padding: 4
                      }}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>


                {/* Bouton de soumission */}
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    height: 56,
                    borderRadius: 14,
                    background: "linear-gradient(135deg, #1F0270, #3B0CB8)",
                    color: "white",
                    border: "none",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: isLoading ? "not-allowed" : "pointer",
                    boxShadow: "0 8px 20px rgba(31, 2, 112, 0.25)",
                    transition: "all 0.25s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    opacity: isLoading ? 0.7 : 1,
                    letterSpacing: "0.3px"
                  }}
                >
                  {isLoading ? "Connexion en cours..." : "Se connecter →"}
                </button>
              </form>
            )}

            {/* Footer */}
            <div style={{ marginTop: 40, textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
              © 2026 N&apos;ma SIM — Tous droits réservés
            </div>
          </div>
        </div>

        {/* SECTION DROITE : Illustration de l'achat de carte SIM */}
        <div style={{
          flex: "0.8",
          background: "#1F0270", // Même couleur que la sidebar admin
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
          position: "relative",
          overflow: "hidden",
          color: "white",
          borderTopLeftRadius: 150,
          borderBottomLeftRadius: 150
        }}>
          {/* Cercle décoratif animé */}
          <div style={{
            position: "absolute",
            top: "10%",
            right: "-10%",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(76, 50, 54, 0.4) 0%, rgba(37, 22, 69, 0.3) 50%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 1,
            animation: "spinSlow 60s linear infinite"
          }} />
          {/* Petit cercle flottant */}
          <div style={{
            position: "absolute",
            bottom: "15%",
            left: "8%",
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: "2px solid rgba(255, 184, 0, 0.3)",
            pointerEvents: "none",
            zIndex: 1,
            animation: "floatUpDown 4s ease-in-out infinite"
          }} />

          <div style={{
            position: "relative",
            zIndex: 10,
            textAlign: "center",
            maxWidth: 480
          }}>
            {/* Titre / Slogan de l'illustration */}
            <h2 style={{ fontSize: 32, fontWeight: 800, color: "#FFB800", margin: 0, marginBottom: 16, letterSpacing: "-0.5px", animation: "fadeInUp 0.8s ease-out" }}>
              Portail Administrateur
            </h2>
            <p style={{ color: "#E5E7EB", fontSize: 16, lineHeight: 1.7, margin: 0, marginBottom: 32, animation: "fadeInUp 0.8s ease-out 0.2s both" }}>
              Votre environnement d&apos;administration moderne, conçu pour accompagner les équipes dans le suivi, la supervision et le pilotage des activités de la solution N&apos;ma SIM.
            </p>

            {/* L'image générée de la personne qui achète sa SIM */}
            <div style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 24,
              padding: 16,
              backdropFilter: "blur(4px)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
              maxHeight: 380,
              animation: "fadeInScale 1s ease-out 0.4s both, pulseGlow 3s ease-in-out infinite 1.5s"
            }}>
              <img
                src="/sim_buying_illustration.png"
                alt="Personne achetant une carte SIM"
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: 16,
                  objectFit: "cover"
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
