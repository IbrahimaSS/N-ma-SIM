"""scanner_carte_electeur.py – Algorithme de découpe pour la Carte d'Électeur.

Utilise la soustraction de fond (couleur médiane du scanner) pour isoler
la carte, quelle que soit la face scannée (recto ou verso).

Fonctions publiques :
    decouper_electeur(img, dpi=300)  → image BGR de la carte seule, ou None
"""

import cv2
import numpy as np


# -----------------------------------------------------------------------
#  Utilitaires internes
# -----------------------------------------------------------------------

def _reduire(img):
    """Réduit l'image pour accélérer la détection. Retourne (img_reduite, scale)."""
    DETECT_MAX_SIDE = 1200
    h, w = img.shape[:2]
    s = min(1.0, DETECT_MAX_SIDE / max(h, w))
    if s < 1.0:
        img = cv2.resize(img, (int(w * s), int(h * s)),
                         interpolation=cv2.INTER_AREA)
    return img, s


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


def _eliminer_fond_electeur(carte):
    """Nettoyage final des bords résiduels du scanner."""
    h, w = carte.shape[:2]
    if h < 50 or w < 50:
        return carte
    gray = cv2.cvtColor(carte, cv2.COLOR_BGR2GRAY)
    std_cols = np.std(gray, axis=0)
    std_rows = np.std(gray, axis=1)
    seuil_std = 8.0
    max_pct = 0.05  # Max 5% par bord – ne couper que les vraies marges du scanner
    left = 0
    while left < int(w * max_pct) and std_cols[left] < seuil_std:
        left += 1
    right = w
    while right > int(w * (1.0 - max_pct)) and std_cols[right - 1] < seuil_std:
        right -= 1
    top = 0
    while top < int(h * max_pct) and std_rows[top] < seuil_std:
        top += 1
    bot = h
    while bot > int(h * (1.0 - max_pct)) and std_rows[bot - 1] < seuil_std:
        bot -= 1
    if (right - left) < w * 0.5 or (bot - top) < h * 0.5:
        return carte
    return carte[top:bot, left:right]


# -----------------------------------------------------------------------
#  Algorithme principal – Carte d'Électeur (recto ET verso)
# -----------------------------------------------------------------------

def decouper_electeur(img, dpi=300):
    """Detecte la carte d'electeur par soustraction de fond.

    Même algorithme pour le recto et le verso.
    La carte est retournée en paysage quelle que soit son orientation sur la vitre.
    """
    if img is None:
        return None

    small, s = _reduire(img)
    h_s, w_s = small.shape[:2]
    aire_img = float(h_s * w_s)

    bg_color = np.median(small.reshape(-1, 3), axis=0)
    diff = np.linalg.norm(small.astype(float) - bg_color.astype(float), axis=2)

    b, g, r = cv2.split(small)
    chroma = (np.abs(r.astype(int) - g.astype(int)) +
              np.abs(g.astype(int) - b.astype(int)) +
              np.abs(r.astype(int) - b.astype(int)))
    gray_sm = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    ombre = (gray_sm < 130) & (chroma < 20)
    diff[ombre] = 0

    best_quad = None
    best_area = 0.0

    m_y = int(h_s * 0.02)
    m_x = int(w_s * 0.02)

    for seuil in [25, 30, 20, 35, 15, 12]:
        binary = (diff > seuil).astype(np.uint8) * 255

        k7 = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
        cleaned = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, k7)
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN,  k7)

        if m_y > 0:
            cleaned[:m_y, :] = 0
            cleaned[-m_y:, :] = 0
        if m_x > 0:
            cleaned[:, :m_x] = 0
            cleaned[:, -m_x:] = 0

        cnts, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for c in cnts:
            hull = cv2.convexHull(c)
            area = cv2.contourArea(hull)
            ratio_a = area / aire_img

            if ratio_a < 0.02 or ratio_a > 0.55:
                continue

            rect = cv2.minAreaRect(hull)
            (cx, cy), (rw, rh), angle = rect
            if min(rw, rh) < 10:
                continue

            ar = max(rw, rh) / min(rw, rh)
            if ar < 0.50 or ar > 2.20:
                continue

            if area > best_area:
                best_area = area
                best_quad = cv2.boxPoints(rect).astype(np.float32)

        if best_quad is not None:
            break

    if best_quad is None:
        return None

    quad = _ordonner_quad(best_quad) / s
    h_full, w_full = img.shape[:2]
    quad[:, 0] = np.clip(quad[:, 0], 0, w_full - 1)
    quad[:, 1] = np.clip(quad[:, 1], 0, h_full - 1)

    tl, tr, br, bl = quad
    W = int(round(max(np.linalg.norm(tr - tl), np.linalg.norm(br - bl))))
    H = int(round(max(np.linalg.norm(bl - tl), np.linalg.norm(br - tr))))
    if W < 50 or H < 50:
        return None

    dst = np.array([[0, 0], [W - 1, 0], [W - 1, H - 1], [0, H - 1]], dtype=np.float32)
    M = cv2.getPerspectiveTransform(quad, dst)
    carte = cv2.warpPerspective(img, M, (W, H), flags=cv2.INTER_CUBIC,
                                borderMode=cv2.BORDER_REPLICATE)

    if carte.shape[0] > carte.shape[1]:
        carte = cv2.rotate(carte, cv2.ROTATE_90_CLOCKWISE)

    carte = _eliminer_fond_electeur(carte)
    return carte
