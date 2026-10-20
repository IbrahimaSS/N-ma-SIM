"use client";
import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { XCircle } from "lucide-react";

interface QrScannerProps {
  lang?: string;
  onDetect: (texte: string) => void;
  onCancel: () => void;
}

/** Lecture d'un QR code avec la caméra de la borne (décodage local, aucune donnée envoyée). */
export function QrScanner({ lang = "fr", onDetect, onCancel }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detecteRef = useRef(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const en = lang === "en";

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    canvasRef.current = document.createElement("canvas");

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then((s) => {
        stream = s;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = s;
        video.play().catch(() => {});
        timer = setInterval(() => {
          if (detecteRef.current || !video.videoWidth) return;
          const canvas = canvasRef.current!;
          // Analyse sur une image réduite : rapide et suffisante pour un QR imprimé
          const echelle = Math.min(1, 640 / video.videoWidth);
          canvas.width = Math.round(video.videoWidth * echelle);
          canvas.height = Math.round(video.videoHeight * echelle);
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) return;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qr = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
          if (qr?.data) {
            detecteRef.current = true;
            onDetect(qr.data);
          }
        }, 250);
      })
      .catch(() => setErreur(en ? "Camera not accessible." : "Caméra inaccessible. Saisissez le code à la main."));

    return () => {
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[4/3] bg-black rounded-2xl overflow-hidden">
      {erreur ? (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white text-sm">{erreur}</div>
      ) : (
        <>
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          {/* Cadre de visée */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-1/2 aspect-square border-4 border-accent rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
          <p className="absolute bottom-3 inset-x-0 text-center text-white text-sm font-semibold">
            {en ? "Show the QR code of your receipt" : "Présentez le QR code de votre reçu"}
          </p>
        </>
      )}
      <button onClick={onCancel} className="absolute top-3 right-3 bg-white/90 rounded-full p-1.5" aria-label={en ? "Close" : "Fermer"}>
        <XCircle className="w-5 h-5 text-text-muted" />
      </button>
    </div>
  );
}
