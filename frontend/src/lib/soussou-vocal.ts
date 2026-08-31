export interface VocalResult {
  intention: string | null;
  raison: string;
  scores?: Record<string, number>;
  niveau_sonore?: number;
  message: string;
}

/**
 * Mapping des étapes courantes de la borne vers les modèles vocaux (pages de l'API FastAPI).
 */
export function getVocalPage(currentStep: string): string | null {
  const MAP: Record<string, string> = {
    "choix-service":       "page_choix_du_service",
    "scan-piece":          "page_type_de_piece",
    "piece-identite":      "page_type_de_piece",
    "motif-reactivation":  "page_motif_reactivation",
  };
  return MAP[currentStep] ?? null;
}

/**
 * Convertit un Float32Array PCM en fichier WAV (16 bits, mono, 16 kHz).
 * Cela évite d'avoir ffmpeg installé sur le serveur Python.
 */
function pcmToWav(pcm: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcm.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);         // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

/**
 * Convertit un Blob audio WebM (navigateur) en WAV 16kHz mono.
 * Utilise l'AudioContext du navigateur — aucune dépendance serveur.
 */
async function convertirEnWav(blob: Blob): Promise<Blob> {
  console.log(`[VOCAL] Conversion WAV : blob WebM de ${blob.size} octets`);
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioContext({ sampleRate: 16000 });
  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    console.log(`[VOCAL] Audio décodé : ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.sampleRate}Hz, ${audioBuffer.numberOfChannels} canal(aux)`);
    const pcm = audioBuffer.getChannelData(0); // Mono
    const wav = pcmToWav(pcm, 16000);
    console.log(`[VOCAL] WAV généré : ${wav.size} octets`);
    return wav;
  } finally {
    await audioCtx.close();
  }
}

/**
 * Enregistre l'audio depuis le microphone du client pendant la durée spécifiée.
 * Retourne un WAV 16kHz mono prêt pour l'API Python (pas de ffmpeg requis).
 */
export async function enregistrerAudio(dureeMs: number): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const morceaux: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) morceaux.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const webmBlob = new Blob(morceaux, { type: "audio/webm" });
        try {
          const wavBlob = await convertirEnWav(webmBlob);
          resolve(wavBlob);
        } catch (err) {
          console.warn("Conversion WAV échouée, envoi brut WebM", err);
          resolve(webmBlob);
        }
      };

      mediaRecorder.start();
      setTimeout(() => {
        if (mediaRecorder.state !== "inactive") mediaRecorder.stop();
      }, dureeMs);
    } catch (error) {
      console.error("Erreur accès micro:", error);
      reject(error);
    }
  });
}

/**
 * Envoie le fichier audio (WAV) à l'API vocale locale via le proxy Next.js.
 */
export async function comprendreIntention(page: string, audioBlob: Blob): Promise<VocalResult> {
  const formData = new FormData();
  formData.append("page", page);
  formData.append("audio", audioBlob, "enregistrement.wav");

  console.log(`[VOCAL] Envoi vers /api/vocal/comprendre — page=${page}, audio=${audioBlob.size} octets, type=${audioBlob.type}`);

  try {
    const res = await fetch("/api/vocal/comprendre", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log("[VOCAL] Réponse API :", data);

    if (!res.ok) {
      return { intention: null, raison: "erreur_api", message: data?.message || "Erreur serveur API vocale" };
    }

    return data;
  } catch (error) {
    console.error("Erreur réseau API vocale:", error);
    return { intention: null, raison: "erreur_reseau", message: "Erreur réseau avec l'API vocale" };
  }
}
