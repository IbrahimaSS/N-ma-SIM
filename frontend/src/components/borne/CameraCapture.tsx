"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { XCircle } from "lucide-react";

type CaptureMode = "document" | "selfie";

interface CameraCaptureProps {
  mode: CaptureMode;
  label?: string; // ex: "Recto" ou "Verso"
  onCapture: (file: File) => void;
  onCancel: () => void;
}

const COUNTDOWN_SEC = 5; // secondes avant capture auto (augmenté pour laisser le temps)

/**
 * CameraCapture — flux caméra live avec guide visuel + capture automatique.
 * - mode="document" : cadre rectangulaire (ratio carte ID) avec coins animés
 * - mode="selfie"   : ellipse ovale pour cadrer le visage
 *
 * Quand la zone de guide est occupée (pixel density > seuil), le cadre passe
 * au vert et un compte à rebours déclenche la capture automatique.
 */
export function CameraCapture({ mode, label, onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); // canvas pour la détection
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDetected, setIsDetected] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [captured, setCaptured] = useState(false);
  const [warmup, setWarmup] = useState(true); // délai mise au point caméra

  // ─── Démarrer la caméra ───────────────────────────────────────────────────
  useEffect(() => {
    const facingMode = mode === "selfie" ? "user" : "environment";
    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },  // résolution maximale possible
          height: { ideal: 1080 },
        },
        audio: false,
      })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        // Délai de 2s pour la mise au point automatique de la webcam
        setTimeout(() => setWarmup(false), 2000);
      })
      .catch(() => setCameraError("Caméra inaccessible. Vérifiez les autorisations."));

    return () => {
      stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // ─── Analyse pixel par frame (Détection + Stabilité) ──────────────────────
  const prevDataRef = useRef<Uint8ClampedArray | null>(null);

  const analyzeFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(analyzeFrame);
      return;
    }

    const W = video.videoWidth;
    const H = video.videoHeight;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, W, H);

    // Zone de détection (correspond exactement au guide visuel de 40% pour document, 40% pour selfie)
    const zoneW = Math.floor(W * (mode === "document" ? 0.40 : 0.40));
    const zoneH = Math.floor(zoneW / (mode === "document" ? 1.586 : 0.75));
    const zoneX = Math.floor((W - zoneW) / 2);
    const zoneY = Math.floor((H - zoneH) / 2);

    const imageData = ctx.getImageData(zoneX, zoneY, zoneW, zoneH);
    const { data } = imageData;
    const totalPixels = zoneW * zoneH;

    // 1. Calcul de la densité (présence d'un objet non-blanc/non-sombre)
    let nonWhiteCount = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      // On exclut les fonds très clairs ou très sombres
      if ((r < 240 || g < 240 || b < 240) && (r > 20 || g > 20 || b > 20)) {
        nonWhiteCount++;
      }
    }
    const density = nonWhiteCount / totalPixels;
    const hasObject = density > 0.60; // Il faut que l'objet remplisse bien le cadre

    // 2. Calcul de la stabilité (mouvement)
    let isStable = false;
    if (prevDataRef.current && prevDataRef.current.length === data.length) {
      let motion = 0;
      // Échantillonnage pour la performance (1 pixel sur 4)
      for (let i = 0; i < data.length; i += 16) {
        const diffR = Math.abs(data[i] - prevDataRef.current[i]);
        const diffG = Math.abs(data[i + 1] - prevDataRef.current[i + 1]);
        const diffB = Math.abs(data[i + 2] - prevDataRef.current[i + 2]);
        motion += diffR + diffG + diffB;
      }
      const avgMotion = motion / (totalPixels / 4);
      // Si avgMotion est faible, la carte ne bouge plus
      isStable = avgMotion < 30; 
    }

    // Mise à jour de la frame précédente pour le prochain calcul
    prevDataRef.current = new Uint8ClampedArray(data);

    // L'objet est "Détecté" seulement s'il est présent ET stabilisé ET hors warmup
    setIsDetected(!warmup && hasObject && isStable);

    rafRef.current = requestAnimationFrame(analyzeFrame);
  }, [mode]);

  // Démarrer l'analyse quand la vidéo est prête
  const handleVideoReady = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(analyzeFrame);
  }, [analyzeFrame]);

  // ─── Gérer le compte à rebours ────────────────────────────────────────────
  useEffect(() => {
    if (captured || warmup) return; // Ne pas démarrer si en phase de warmup

    if (isDetected && countdown === null) {
      // Démarrer le compte à rebours
      setCountdown(COUNTDOWN_SEC);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            return 0; // déclenche la capture
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isDetected && countdown !== null) {
      // Objet retiré → annuler le compte à rebours
      if (countdownRef.current) clearInterval(countdownRef.current);
      setCountdown(null);
    }
  }, [isDetected, countdown, captured]);

  // ─── Capture automatique quand countdown atteint 0 ───────────────────────
  useEffect(() => {
    if (countdown === 0 && !captured) {
      doCapture();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  const doCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || captured) return;
    setCaptured(true);

    const W = video.videoWidth;
    const H = video.videoHeight;

    // On capture TOUTE l'image de la caméra (pleine résolution)
    // Le cadre guide est uniquement visuel pour aider l'utilisateur à centrer.
    // Envoyer l'image complète garantit une résolution suffisante pour l'OCR.
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      if (mode === "selfie") {
        ctx.translate(W, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, W, H);
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      const filename = mode === "selfie" ? "selfie_capture.jpg" : "document_capture.jpg";
      const file = new File([blob], filename, { type: "image/jpeg" });
      stop();
      onCapture(file);
    }, "image/jpeg", 0.97);
  }, [captured, mode, onCapture, stop]);

  // ─── Styles du guide ─────────────────────────────────────────────────────
  const guideColor = isDetected ? "#22c55e" : "#ef4444"; // success vert / danger rouge
  const guideShadow = isDetected
    ? "0 0 24px 4px rgba(34,197,94,0.45)"
    : "0 0 18px 2px rgba(239,68,68,0.35)";

  const guideLabel = isDetected
    ? countdown !== null && countdown > 0
      ? `Bien positionné — ${countdown}...`
      : "Capture en cours..."
    : mode === "document"
    ? "Placez votre pièce dans le cadre"
    : "Positionnez votre visage dans l'ovale";

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "16/9" }}>
      {/* Stream vidéo */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted
        onCanPlay={handleVideoReady}
        style={{ transform: mode === "selfie" ? "scaleX(-1)" : "none" }}
      />

      {/* Canvas caché pour l'analyse — ne s'affiche pas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Overlay warmup — mise au point de la caméra */}
      {warmup && !cameraError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white text-sm font-semibold">Initialisation de la caméra...</p>
          </div>
        </div>
      )}

      {/* Overlay d'erreur */}
      {cameraError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-sm p-6 text-center z-20">
          {cameraError}
        </div>
      )}

      {/* Overlay guide + label */}
      {!cameraError && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          {mode === "document" ? (
            /* Guide rectangulaire pour carte d'identité — ratio ISO 85.6×53.98mm ≈ 1.586:1 */
            <div
              style={{
                width: "40%", // Cadre encore plus petit pour forcer l'éloignement et la mise au point
                aspectRatio: "1.586",
                border: `3px solid ${guideColor}`,
                borderRadius: "12px",
                boxShadow: guideShadow,
                transition: "border-color 0.4s, box-shadow 0.4s",
                position: "relative",
              }}
            >
              {/* Coins animés */}
              {[
                { top: -3, left: -3, borderTop: `4px solid ${guideColor}`, borderLeft: `4px solid ${guideColor}`, borderRadius: "6px 0 0 0" },
                { top: -3, right: -3, borderTop: `4px solid ${guideColor}`, borderRight: `4px solid ${guideColor}`, borderRadius: "0 6px 0 0" },
                { bottom: -3, left: -3, borderBottom: `4px solid ${guideColor}`, borderLeft: `4px solid ${guideColor}`, borderRadius: "0 0 0 6px" },
                { bottom: -3, right: -3, borderBottom: `4px solid ${guideColor}`, borderRight: `4px solid ${guideColor}`, borderRadius: "0 0 6px 0" },
              ].map((style, i) => (
                <div key={i} style={{ position: "absolute", width: 24, height: 24, ...style }} />
              ))}
            </div>
          ) : (
            /* Guide ellipse pour selfie */
            <div
              style={{
                width: "52%",
                aspectRatio: "0.75",
                border: `3px solid ${guideColor}`,
                borderRadius: "50%",
                boxShadow: guideShadow,
                transition: "border-color 0.4s, box-shadow 0.4s",
              }}
            />
          )}
        </div>
      )}

      {/* Label flottant en bas */}
      {!cameraError && (
        <div
          className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-2 pb-4 pt-3 z-20"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)" }}
        >
          {/* Compte à rebours visuel */}
          {countdown !== null && countdown > 0 && (
            <span
              className="text-5xl font-black"
              style={{ color: guideColor, textShadow: guideShadow, lineHeight: 1 }}
            >
              {countdown}
            </span>
          )}

          {/* Label / label du côté (Recto, Verso) */}
          <div className="flex items-center gap-3">
            {label && (
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                {label}
              </span>
            )}
            <span
              className="text-sm font-semibold px-4 py-1.5 rounded-full backdrop-blur-sm"
              style={{
                background: isDetected ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)",
                color: "white",
                border: `1px solid ${guideColor}`,
              }}
            >
              {guideLabel}
            </span>
          </div>
        </div>
      )}

      {/* Bouton Annuler — toujours cliquable */}
      <button
        onClick={() => { stop(); onCancel(); }}
        className="absolute top-3 right-3 z-30 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition pointer-events-auto"
        title="Annuler"
      >
        <XCircle className="w-5 h-5" />
      </button>
    </div>
  );
}
