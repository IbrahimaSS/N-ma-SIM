/**
 * Recadrage automatique d'une pièce d'identité (photo caméra, import ou scan imprimante).
 *
 * Principe (tout se fait dans le navigateur, sans librairie) :
 *  1. on estime la couleur du fond (vitre du scanner, table…) à partir du bord de l'image ;
 *  2. on repère les pixels qui s'en distinguent nettement → la pièce ;
 *  3. on garde le plus grand bloc continu de lignes / colonnes « occupées » → boîte de la pièce ;
 *  4. on découpe cette boîte dans l'image d'origine (pleine résolution, proportions conservées).
 *
 * Prudence : en cas de doute, on renvoie l'image d'origine plutôt que de couper la pièce.
 */

export type StatutRecadrage =
  | "recadre"      // pièce trouvée et découpée
  | "deja_cadre"   // la pièce occupe déjà toute l'image
  | "incertain"    // forme inattendue : image d'origine conservée
  | "introuvable"; // aucune pièce détectée (scan vide, photo noire…)

export interface ResultatRecadrage {
  file: File;
  statut: StatutRecadrage;
}

const TAILLE_ANALYSE = 480;    // côté max de l'image réduite servant à la détection
const TAILLE_SORTIE_MAX = 2400; // côté max de l'image envoyée à l'OCR
const TAILLE_SORTIE_MIN = 1600; // côté min : une pièce trop petite est agrandie pour que l'OCR lise bien
const ECART_FOND = 60;          // écart de couleur (somme RVB) pour considérer un pixel « pièce »

/** Plus long bloc continu d'indices actifs, en tolérant de petits trous. */
function plusLongBloc(actifs: boolean[], trouMax: number): [number, number] | null {
  let meilleur: [number, number] | null = null;
  let debut = -1, fin = -1, trou = 0;
  const clore = () => {
    if (debut >= 0 && (!meilleur || fin - debut > meilleur[1] - meilleur[0])) meilleur = [debut, fin];
  };
  actifs.forEach((a, i) => {
    if (a) {
      if (debut < 0) debut = i;
      fin = i; trou = 0;
    } else if (debut >= 0 && ++trou > trouMax) {
      clore(); debut = -1; trou = 0;
    }
  });
  clore();
  return meilleur;
}

/**
 * Exporte la zone (x, y, l, h) de l'image — ou l'image entière — en JPEG, mise à l'échelle
 * de façon UNIFORME (aucune déformation) pour que son grand côté soit entre TAILLE_SORTIE_MIN
 * et TAILLE_SORTIE_MAX. Image entière déjà à la bonne taille : fichier d'origine conservé.
 */
async function exporter(
  image: ImageBitmap, file: File, statut: StatutRecadrage,
  zone?: { x: number; y: number; l: number; h: number },
): Promise<ResultatRecadrage> {
  const { x, y, l, h } = zone ?? { x: 0, y: 0, l: image.width, h: image.height };
  const grand = Math.max(l, h);
  const echelle = grand < TAILLE_SORTIE_MIN ? TAILLE_SORTIE_MIN / grand
    : grand > TAILLE_SORTIE_MAX ? TAILLE_SORTIE_MAX / grand : 1;
  if (!zone && echelle === 1) return { file, statut };
  const out = document.createElement("canvas");
  out.width = Math.round(l * echelle);
  out.height = Math.round(h * echelle);
  const octx = out.getContext("2d");
  if (!octx) return { file, statut };
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = "high";
  octx.drawImage(image, x, y, l, h, 0, 0, out.width, out.height);
  const blob = await new Promise<Blob | null>((ok) => out.toBlob(ok, "image/jpeg", 0.93));
  if (!blob) return { file, statut };
  const nom = file.name.replace(/\.[^.]+$/, "") + (zone ? "_cadre.jpg" : "_net.jpg");
  return { file: new File([blob], nom, { type: "image/jpeg" }), statut };
}

function mediane(valeurs: number[]): number {
  const v = [...valeurs].sort((a, b) => a - b);
  return v[Math.floor(v.length / 2)] ?? 0;
}

export async function recadrerPiece(file: File): Promise<ResultatRecadrage> {
  let image: ImageBitmap;
  try {
    image = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return { file, statut: "incertain" };
  }

  try {
    // 1) Image réduite pour l'analyse
    const echelle = Math.min(1, TAILLE_ANALYSE / Math.max(image.width, image.height));
    const W = Math.max(1, Math.round(image.width * echelle));
    const H = Math.max(1, Math.round(image.height * echelle));
    const petit = document.createElement("canvas");
    petit.width = W; petit.height = H;
    const ctx = petit.getContext("2d", { willReadFrequently: true });
    if (!ctx) return { file, statut: "incertain" };
    ctx.drawImage(image, 0, 0, W, H);
    const px = ctx.getImageData(0, 0, W, H).data;

    // 2) Couleur du fond = médiane des pixels du bord (2 %)
    const bord = Math.max(2, Math.round(Math.min(W, H) * 0.02));
    const fr: number[] = [], fg: number[] = [], fb: number[] = [];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (x >= bord && x < W - bord && y >= bord && y < H - bord) continue;
        const i = (y * W + x) * 4;
        fr.push(px[i]); fg.push(px[i + 1]); fb.push(px[i + 2]);
      }
    }
    const [r0, g0, b0] = [mediane(fr), mediane(fg), mediane(fb)];
    const procheFond = (r: number, g: number, b: number) =>
      Math.abs(r - r0) + Math.abs(g - g0) + Math.abs(b - b0) <= ECART_FOND;

    // Bord non uniforme : ce n'est pas un fond (vitre, table) mais déjà la pièce elle-même
    // (image cadrée, photo prise de près) → on n'y touche pas.
    // (critère plus strict que le masque : une vitre de scanner ou une table unie varie très peu)
    let bordUniforme = 0;
    for (let k = 0; k < fr.length; k++) {
      if (Math.abs(fr[k] - r0) + Math.abs(fg[k] - g0) + Math.abs(fb[k] - b0) <= ECART_FOND / 2) bordUniforme++;
    }
    if (bordUniforme / fr.length < 0.75) return await exporter(image, file, "deja_cadre");

    // 3) Masque « pièce » + projections lignes / colonnes
    const masque = new Uint8Array(W * H);
    const parLigne = new Array<number>(H).fill(0);
    let total = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if (!procheFond(px[i], px[i + 1], px[i + 2])) {
          masque[y * W + x] = 1;
          parLigne[y]++;
          total++;
        }
      }
    }
    // Image quasi vide (scan sans pièce posée, photo noire) → aucune pièce
    if (total < W * H * 0.005) return { file, statut: "introuvable" };
    // Au-delà, en cas de doute on garde l'image d'origine (« incertain ») sans bloquer le client
    const maxLigne = Math.max(...parLigne);
    const lignes = plusLongBloc(parLigne.map((n) => n > maxLigne * 0.3), Math.round(H * 0.02));
    if (!lignes) return await exporter(image, file, "incertain");

    // Colonnes comptées uniquement dans la bande de lignes retenue (ignore les taches ailleurs)
    const parColonne = new Array<number>(W).fill(0);
    for (let y = lignes[0]; y <= lignes[1]; y++) {
      for (let x = 0; x < W; x++) parColonne[x] += masque[y * W + x];
    }
    const maxColonne = Math.max(...parColonne);
    const colonnes = plusLongBloc(parColonne.map((n) => n > maxColonne * 0.3), Math.round(W * 0.02));
    if (!colonnes) return await exporter(image, file, "incertain");

    const bw = colonnes[1] - colonnes[0] + 1;
    const bh = lignes[1] - lignes[0] + 1;
    const surface = (bw * bh) / (W * H);
    if (surface < 0.04) return await exporter(image, file, "incertain");
    if (surface > 0.9) return await exporter(image, file, "deja_cadre");
    const ratio = Math.max(bw, bh) / Math.min(bw, bh);
    // Carte ID ≈ 1,59 ; page de passeport ≈ 1,42 ; passeport ouvert ≈ 1,4. Au-delà : doute.
    if (ratio < 1.15 || ratio > 2.1) return await exporter(image, file, "incertain");

    // 4) Découpe en pleine résolution, avec une petite marge pour ne rien rogner
    const marge = 0.02;
    const x0 = Math.max(0, (colonnes[0] - bw * marge) / echelle);
    const y0 = Math.max(0, (lignes[0] - bh * marge) / echelle);
    const x1 = Math.min(image.width, (colonnes[1] + 1 + bw * marge) / echelle);
    const y1 = Math.min(image.height, (lignes[1] + 1 + bh * marge) / echelle);
    // Zoom sur la pièce (et agrandissement si elle est petite), proportions conservées
    return await exporter(image, file, "recadre", { x: x0, y: y0, l: x1 - x0, h: y1 - y0 });
  } catch {
    return { file, statut: "incertain" };
  } finally {
    image.close();
  }
}
