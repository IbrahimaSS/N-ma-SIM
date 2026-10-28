"""Extraction du contour exterieur sur une vitre a fond uniforme."""

import cv2
import numpy as np

from scanner_carte_identite import _ordonner_quad


def decouper_fond(img):
    h, w = img.shape[:2]
    scale = min(1.0, 1000 / max(h, w))
    small = cv2.resize(img, (round(w * scale), round(h * scale)))
    # La mediane resiste au texte et a une carte occupant une petite partie de la vitre.
    fond = np.median(small.reshape(-1, 3), axis=0)
    distance = np.max(np.abs(small.astype(np.float32) - fond), axis=2)
    kernel = np.ones((5, 5), np.uint8)

    # Une piece claire sur la vitre peut etre moins contrastee que son contour.
    # Descendre le seuil progressivement evite de ne garder que ce contour.
    for seuil in (30, 24, 20, 16, 12):
        mask = (distance > seuil).astype(np.uint8) * 255
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for contour in sorted(contours, key=cv2.contourArea, reverse=True):
            area = cv2.contourArea(contour)
            if not 0.02 < area / mask.size < 0.60:
                continue
            rect = cv2.minAreaRect(contour)
            rw, rh = rect[1]
            if min(rw, rh) < 20 or not 1.1 < max(rw, rh) / min(rw, rh) < 2.5:
                continue
            if area / (rw * rh) < 0.85:
                continue
            quad = _ordonner_quad(cv2.boxPoints(rect)) / scale
            if (quad[:, 0] < 1).any() or (quad[:, 1] < 1).any():
                continue
            if (quad[:, 0] >= w - 1).any() or (quad[:, 1] >= h - 1).any():
                continue
            tl, tr, br, bl = quad
            width = round(max(np.linalg.norm(tr - tl), np.linalg.norm(br - bl)))
            height = round(max(np.linalg.norm(bl - tl), np.linalg.norm(br - tr)))
            target = np.float32([[0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]])
            transform = cv2.getPerspectiveTransform(quad, target)
            return cv2.warpPerspective(img, transform, (width, height))
    return None
