"use client";
import { useEffect, useState } from "react";

export function QrCode({ path, size = 120, alt }: { path: string; size?: number; alt: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const url = `${window.location.origin}${path}`;
    setSrc(`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`);
  }, [path, size]);

  if (!src) {
    return <div style={{ width: size, height: size }} />;
  }

  return <img src={src} alt={alt} style={{ width: size, height: size, display: "block" }} />;
}
