"""scanner_permis.py – Algorithme de découpe pour le Permis Biométrique.

Utilise le Gradient Morphologique pour détecter les zones de texte/texture
et ignorer le fond lisse du scanner.

Fonctions publiques :
    decouper_permis(img, dpi=300)  → image BGR de la carte seule, ou None
"""

import cv2
import numpy as np


# -----------------------------------------------------------------------
#  Utilitaires internes
# -----------------------------------------------------------------------

def _ordonner_quad(pts):
    """Ordonne 4 coins : TL → TR → BR → BL, côté long en largeur (paysage)."""
    pts = pts.reshape(4, 2).astype(np.float32)
    s = pts.sum(axis=1)
    d = np.diff(pts, axis=1).ravel()
    ordered = np.array([
        pts[np.argmin(s)],   # TL
        pts[np.argmin(d)],   # TR
        pts[np.argmax(s)],   # BR
        pts[np.argmax(d)],   # BL
    ], dtype=np.float32)
    # Si la carte est en portrait, on la bascule en paysage
    w_card = np.linalg.norm(ordered[1] - ordered[0])
    h_card = np.linalg.norm(ordered[3] - ordered[0])
    if h_card > w_card:
        ordered = np.roll(ordered, -1, axis=0)
    return ordered


def _eliminer_fond_permis(carte):
    """Supprime les pochettes plastiques ou marges vides.

    Utilise la densité des contours (Canny). Une pochette plastique
    est transparente et lisse (peu de contours). La vraie carte est
    dense en contours (texte, photo). On coupe tout ce qui est vide.
    """
    h, w = carte.shape[:2]
    if h < 50 or w < 50:
        return carte

    gray = cv2.cvtColor(carte, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)

    # Pourcentage de pixels de contours par ligne et colonne
    col_density = np.sum(edges > 0, axis=0) / h
    row_density = np.sum(edges > 0, axis=1) / w

    # Lissage (moyenne mobile) pour ignorer les coutures fines du plastique
    window_col = max(3, w // 40)
    window_row = max(3, h // 40)

    col_smooth = np.convolve(col_density, np.ones(window_col)/window_col, mode='same')
    row_smooth = np.convolve(row_density, np.ones(window_row)/window_row, mode='same')

    # Seuil de densité : en dessous de 3.5%, on considère que c'est du plastique vide
    seuil = 0.035
    max_pct = 0.22  # On autorise à couper jusqu'à 22% par bord (large pochette)

    left = 0
    while left < int(w * max_pct) and col_smooth[left] < seuil:
        left += 1

    right = w
    while right > int(w * (1.0 - max_pct)) and col_smooth[right - 1] < seuil:
        right -= 1

    top = 0
    while top < int(h * max_pct) and row_smooth[top] < seuil:
        top += 1

    bot = h
    while bot > int(h * (1.0 - max_pct)) and row_smooth[bot - 1] < seuil:
        bot -= 1

    if (right - left) < w * 0.5 or (bot - top) < h * 0.5:
        return carte

    return carte[top:bot, left:right]


# -----------------------------------------------------------------------
#  Algorithme principal – Permis Biométrique
# -----------------------------------------------------------------------

def decouper_permis(img, dpi=300):
    """Détecte et extrait le Permis de Conduire Biométrique.

    Le permis biométrique a le même format qu'une carte bancaire (85.6×54mm)
    mais avec une surface riche en texte, photo et puce électronique.
    - Format paysage forcé (ratio L/H ~ 1.58)
    - Plastique rigide, bien défini sur la vitre
    - Ratio accepté : 1.2 – 2.0 (un peu plus strict que la carte ID)
    """
    if img is None:
        return None

    # 1. Réduire l'image pour accélérer (largeur max ~800px)
    h, w = img.shape[:2]
    s = min(1.0, 800.0 / max(h, w))
    if s < 1.0:
        small = cv2.resize(img, (int(w * s), int(h * s)), interpolation=cv2.INTER_AREA)
    else:
        small = img.copy()

    h_s, w_s = small.shape[:2]
    aire_img = float(h_s * w_s)

    # 2. Passage en niveaux de gris
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)

    # 3. Gradient Morphologique (fait ressortir tous les bords, textes, motifs)
    # Les zones lisses (ombres, fond blanc) deviendront noires (0).
    kernel_grad = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    grad = cv2.morphologyEx(gray, cv2.MORPH_GRADIENT, kernel_grad)

    # 4. Binarisation (Garder uniquement les vrais bords)
    _, binary = cv2.threshold(grad, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)

    # 5. Fusionner tous les textes/motifs en UN SEUL bloc solide (la carte)
    # Noyau réduit (25x25) pour éviter de fusionner avec les bords d'une pochette plastique
    kernel_close = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 25))
    closed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel_close)

    # Nettoyage additionnel (enlever les petites poussières)
    kernel_open = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
    opened = cv2.morphologyEx(closed, cv2.MORPH_OPEN, kernel_open)

    # 6. Ignorer les bords extrêmes de la vitre (rails du scanner)
    margin_y = int(h_s * 0.02)
    margin_x = int(w_s * 0.02)
    opened[:margin_y, :] = 0
    opened[-margin_y:, :] = 0
    opened[:, :margin_x] = 0
    opened[:, -margin_x:] = 0

    # 7. Trouver le plus grand contour (la carte)
    cnts, _ = cv2.findContours(opened, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    best_quad = None
    best_area = 0

    for c in cnts:
        area = cv2.contourArea(c)
        ratio_a = area / aire_img

        # La carte doit faire entre 3% et 60% de la vitre
        if ratio_a < 0.03 or ratio_a > 0.60:
            continue

        rect = cv2.minAreaRect(c)
        (cx, cy), (rw, rh), angle = rect
        if min(rw, rh) < 10:
            continue

        ar = max(rw, rh) / min(rw, rh)
        # Permis biométrique : même format carte ID, ratio L/H ~ 1.58
        # On accepte 1.2 – 2.0 (plus strict que carte ID générique)
        if ar < 1.2 or ar > 2.0:
            continue

        if area > best_area:
            best_area = area
            best_quad = cv2.boxPoints(rect).astype(np.float32)

    if best_quad is None:
        return None

    # ---- 8. Redressement de perspective en pleine résolution ----
    quad = _ordonner_quad(best_quad) / s

    # Sécurité : clamper aux limites de l'image
    quad[:, 0] = np.clip(quad[:, 0], 0, w - 1)
    quad[:, 1] = np.clip(quad[:, 1], 0, h - 1)

    tl, tr, br, bl = quad
    W = int(round(max(np.linalg.norm(tr - tl), np.linalg.norm(br - bl))))
    H = int(round(max(np.linalg.norm(bl - tl), np.linalg.norm(br - tr))))

    if W < 50 or H < 50:
        return None

    dst = np.array([[0, 0], [W - 1, 0], [W - 1, H - 1], [0, H - 1]], dtype=np.float32)
    M = cv2.getPerspectiveTransform(quad, dst)
    carte = cv2.warpPerspective(img, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

    # Basculer en paysage si nécessaire
    if carte.shape[0] > carte.shape[1]:
        carte = cv2.rotate(carte, cv2.ROTATE_90_CLOCKWISE)

    # Éliminer les micro-marges résiduelles
    carte = _eliminer_fond_permis(carte)

    return carte
