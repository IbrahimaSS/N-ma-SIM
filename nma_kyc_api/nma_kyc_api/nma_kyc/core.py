# -*- coding: utf-8 -*-
"""
nma_kyc.core — Cœur métier du pipeline KYC N'ma SIM (Orange Guinée).

Ce module contient TOUTE la logique de vérification d'identité :
  - prétraitement image (OpenCV)
  - OCR (PP-OCRv5 mobile via PaddleOCR 3.x)
  - lecture MRZ (CNI TD1, passeport TD3) + validation par check digits ICAO
  - extraction des champs (CNI, passeport, carte d'électeur)
  - vérification faciale (InsightFace / ArcFace)
  - règles métier : âge minimum, validité de la pièce
  - score de risque et décision (ACCEPTÉ / VÉRIFICATION MANUELLE / REJETÉ)

Point d'entrée principal : kyc_complet(chemin_recto, chemin_verso, chemin_selfie) -> dict

⚠️ Le moteur OCR et le moteur visage se chargent au PREMIER appel (lazy loading),
   ce qui évite de bloquer le démarrage du serveur.
"""

import os                        # variables d'environnement
# 🔴 Contournement du bug oneDNN de Paddle 3.x sur CPU : à définir AVANT d'importer paddle.
os.environ["FLAGS_use_mkldnn"] = "0"   # désactive oneDNN (évite NotImplementedError ...onednn_instruction.cc)
import cv2                        # OpenCV : traitement d'image
import numpy as np                 # NumPy : calcul matriciel
import re                          # Expressions régulières (dates, numéros)
import unicodedata                 # Normalisation des accents
from rapidfuzz import fuzz         # Correspondance approximative (tolère l'OCR)

# 👉 MOTEUR OCR : "paddleocr" = PP-OCRv5 mobile (défaut, précis, déployable Pi)
MOTEUR_OCR = "paddleocr"
UTILISER_GPU = False                                       # True pour EasyOCR/Hunyuan sur GPU Colab

# 👉 MOTEUR VISAGE : "insightface" (ArcFace, recommandé) ou "deepface"
MOTEUR_VISAGE = "insightface"

SEUIL_NETTETE_ELECTEUR = 40                                # carte d'électeur sous ce seuil -> REPRENDRE_PHOTO (abaissé : 200 rejetait les photos de borne lisibles)
SEUIL_VISAGE = 0.35                                        # seuil de similarité ArcFace (>= = même personne)
AGE_MINIMUM = 18                                           # âge minimum pour obtenir une SIM (ajuste selon l'ARPT)

def creer_moteur_ocr(moteur="easyocr", gpu=True):
    """Crée le moteur OCR choisi et renvoie une fonction extraire_zones(image) unifiée.
    Chaque zone est un dict : {texte, conf, cx, cy, xg, yh}
    (cx,cy = centre ; xg = bord gauche ; yh = bord haut de la boîte)."""

    if moteur == "easyocr":                               # ---------- EasyOCR ----------
        import easyocr                                     # bibliothèque EasyOCR
        lecteur = easyocr.Reader(['fr'], gpu=gpu)          # lecteur français (chargé 1 fois)
        def extraire_zones(image):                         # fonction d'extraction unifiée
            H, W = image.shape[:2]                          # dimensions de l'image (pour le relatif)
            zones = []                                     # liste de zones à renvoyer
            for bbox, texte, conf in lecteur.readtext(image, detail=1):  # OCR avec positions
                xs = [p[0] for p in bbox]                  # les 4 x de la boîte
                ys = [p[1] for p in bbox]                  # les 4 y de la boîte
                cx, cy = sum(xs)/4, sum(ys)/4              # centre (pixels)
                xg, yh = min(xs), min(ys)                  # coin haut-gauche (pixels)
                zones.append({                             # on stocke la zone au format unifié
                    "texte": texte, "conf": float(conf),
                    "cx": int(cx), "cy": int(cy), "xg": int(xg), "yh": int(yh),  # ABSOLU (px)
                    "rx": cx/W, "ry": cy/H, "rxg": xg/W, "ryh": yh/H,            # RELATIF [0,1]
                })
            return zones
        return extraire_zones

    elif moteur == "paddleocr":                           # ---------- PaddleOCR 3.x / PP-OCRv5 ----------
        import os
        # Le bug oneDNN de Paddle 3.x sur CPU est contourné en désactivant mkldnn AVANT l'import.
        os.environ.setdefault("FLAGS_use_mkldnn", "0")     # sécurité (déjà posé en section 2)
        from paddleocr import PaddleOCR                     # PaddleOCR 3.x

        # --- Initialisation PP-OCRv5 MOBILE (léger, CPU, déployable Raspberry Pi) ---
        # On tente d'abord PP-OCRv5 mobile explicite ; repli sur l'init par défaut si l'API diffère.
        essais_init = [
            dict(text_detection_model_name="PP-OCRv5_mobile_det",     # détection PP-OCRv5 mobile
                 text_recognition_model_name="PP-OCRv5_mobile_rec",   # reconnaissance PP-OCRv5 mobile
                 use_doc_orientation_classify=False, use_doc_unwarping=False,
                 use_textline_orientation=False, lang="en"),
            dict(lang="en", use_doc_orientation_classify=False,       # repli : PP-OCRv5 par défaut (3.x)
                 use_doc_unwarping=False, use_textline_orientation=False),
            dict(lang="en"),                                          # repli minimal
        ]
        moteur_p = None; derniere_err = None
        for kw in essais_init:
            try:
                moteur_p = PaddleOCR(**kw); break          # succès -> on sort
            except TypeError as e:
                derniere_err = e; continue                 # signature suivante
        if moteur_p is None:
            raise RuntimeError(f"Init PP-OCRv5 impossible : {derniere_err}")

        def _appel(image):
            """Appelle l'OCR 3.x (predict), avec repli sur ocr() par sécurité."""
            tentatives = []
            if hasattr(moteur_p, "predict"):               # 3.x
                tentatives += [lambda: moteur_p.predict(image),
                               lambda: moteur_p.predict(input=image)]
            if hasattr(moteur_p, "ocr"):                   # compat
                tentatives += [lambda: moteur_p.ocr(image)]
            err = None
            for t in tentatives:
                try:
                    return t()
                except TypeError as e:
                    err = e; continue
            raise RuntimeError(f"Appel PP-OCRv5 échoué : {err}")

        def _xy(bbox):
            """Extrait x et y d'une boîte en 4 points OU en rectangle [x1,y1,x2,y2]."""
            arr = np.array(bbox).flatten()                 # aplatit
            if arr.size == 4:                              # rectangle
                return [arr[0], arr[2]], [arr[1], arr[3]]
            pts = np.array(bbox).reshape(-1, 2)            # polygone
            return pts[:, 0].tolist(), pts[:, 1].tolist()

        def _vers_zones(res, W, H):
            """Convertit le résultat PaddleOCR (2.x OU 3.x) en zones unifiées (avec positions relatives)."""
            zones = []
            if not res:                                    # rien détecté
                return zones
            premier = res[0]                               # premier élément (par image)

            def _ajouter(texte, conf, xs, ys):             # helper : ajoute une zone au format unifié
                cx, cy = sum(xs)/len(xs), sum(ys)/len(ys)  # centre (pixels)
                xg, yh = min(xs), min(ys)                  # coin haut-gauche (pixels)
                zones.append({"texte": texte, "conf": float(conf),
                              "cx": int(cx), "cy": int(cy), "xg": int(xg), "yh": int(yh),  # ABSOLU
                              "rx": cx/W, "ry": cy/H, "rxg": xg/W, "ryh": yh/H})            # RELATIF

            # Format 3.x : dict/objet avec rec_texts, rec_scores, rec_polys
            if hasattr(premier, "get") and premier.get("rec_texts") is not None:
                textes = premier.get("rec_texts", [])
                scores = premier.get("rec_scores", [])
                polys  = (premier.get("rec_polys") or premier.get("dt_polys")
                          or premier.get("rec_boxes") or [])
                for i, texte in enumerate(textes):
                    bbox = polys[i] if i < len(polys) else [0, 0, 0, 0]
                    conf = scores[i] if i < len(scores) else 0.0
                    xs, ys = _xy(bbox)
                    _ajouter(texte, conf, xs, ys)
                return zones

            # Format 2.x : liste de [bbox, (texte, conf)]
            lignes = premier if isinstance(premier, list) else res
            for item in lignes:
                try:
                    bbox = item[0]; texte, conf = item[1]
                except Exception:
                    continue
                xs, ys = _xy(bbox)
                _ajouter(texte, conf, xs, ys)
            return zones

        def extraire_zones(image):                         # même signature/format que EasyOCR
            H, W = image.shape[:2]                          # dimensions pour le relatif
            return _vers_zones(_appel(image), W, H)
        return extraire_zones

    elif moteur == "hunyuan":                             # ---------- HunyuanOCR (Tencent, VLM 1B) ----------
        # ⚠️ VLM 1B : nécessite un GPU (Colab). Lent en CPU/transformers (~40-200 s/image).
        #    NON déployable sur Raspberry Pi -> à réserver au prototypage/comparaison de précision.
        #    transformers >= 5.13 requis (voir le repo Tencent-Hunyuan/HunyuanOCR).
        import torch, re as _re, json as _json
        from PIL import Image
        from transformers import AutoProcessor, HunYuanVLForConditionalGeneration

        modele_id = "tencent/HunyuanOCR"                   # poids sur Hugging Face
        proc = AutoProcessor.from_pretrained(modele_id, trust_remote_code=True)
        modele_hy = HunYuanVLForConditionalGeneration.from_pretrained(
            modele_id, torch_dtype="auto",
            device_map="auto" if UTILISER_GPU else None, trust_remote_code=True)

        # Prompt "spotting" : on demande le texte AVEC ses coordonnées au niveau ligne.
        PROMPT_SPOTTING = ("Detect and recognize all text lines in the image. "
                           "Return each line as JSON: {\"text\": ..., \"bbox\": [x1,y1,x2,y2]}.")

        def _appel_hunyuan(image_bgr):
            image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)   # OpenCV BGR -> RGB
            pil = Image.fromarray(image_rgb)                          # image PIL attendue par le processor
            messages = [{"role":"user","content":[
                {"type":"image","image":pil},{"type":"text","text":PROMPT_SPOTTING}]}]
            texte_prompt = proc.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
            entrees = proc(text=[texte_prompt], images=[pil], return_tensors="pt")
            if UTILISER_GPU: entrees = entrees.to("cuda")
            with torch.no_grad():
                sortie = modele_hy.generate(**entrees, max_new_tokens=4096, do_sample=False,
                                            repetition_penalty=1.08)
            # on ne garde que les tokens générés (après le prompt)
            gen = sortie[0][entrees["input_ids"].shape[1]:]
            return proc.decode(gen, skip_special_tokens=True)

        def _hunyuan_vers_zones(texte, W, H):
            """Parse la sortie (lignes JSON {text, bbox}) en zones unifiées avec positions relatives.
            ⚠️ Le format exact peut varier : vérifie une 1re sortie et ajuste ce parseur si besoin."""
            zones = []
            for m in _re.finditer(r'\{[^{}]*\}', texte):    # chaque objet JSON de la réponse
                try:
                    obj = _json.loads(m.group())
                    t = obj.get("text") or obj.get("texte") or ""
                    bb = obj.get("bbox") or obj.get("box") or obj.get("poly")
                    if not t or not bb: continue
                    arr = np.array(bb).flatten()
                    xs = [arr[0], arr[2]] if arr.size == 4 else np.array(bb).reshape(-1,2)[:,0]
                    ys = [arr[1], arr[3]] if arr.size == 4 else np.array(bb).reshape(-1,2)[:,1]
                    cx, cy = float(np.mean(xs)), float(np.mean(ys))
                    xg, yh = float(np.min(xs)), float(np.min(ys))
                    zones.append({"texte":t,"conf":1.0,
                                  "cx":int(cx),"cy":int(cy),"xg":int(xg),"yh":int(yh),
                                  "rx":cx/W,"ry":cy/H,"rxg":xg/W,"ryh":yh/H})
                except Exception:
                    continue
            return zones

        def extraire_zones(image):
            H, W = image.shape[:2]
            return _hunyuan_vers_zones(_appel_hunyuan(image), W, H)
        return extraire_zones

    else:
        raise ValueError("MOTEUR_OCR doit être 'easyocr', 'paddleocr' ou 'hunyuan'")

def ordonner_points(pts):
    """Range 4 points : haut-gauche, haut-droite, bas-droite, bas-gauche."""
    rect = np.zeros((4,2), dtype="float32")               # tableau des coins ordonnés
    s = pts.sum(axis=1)                                   # somme x+y
    rect[0] = pts[np.argmin(s)]; rect[2] = pts[np.argmax(s)]   # HG (min) / BD (max)
    d = np.diff(pts, axis=1)                              # différence y-x
    rect[1] = pts[np.argmin(d)]; rect[3] = pts[np.argmax(d)]   # HD (min) / BG (max)
    return rect

def transformation_4_points(image, pts):
    """Redresse le document vu de face."""
    rect = ordonner_points(pts); (hg,hd,bd,bg) = rect     # coins ordonnés
    larg = max(int(np.hypot(*(bd-bg))), int(np.hypot(*(hd-hg))))  # largeur cible
    haut = max(int(np.hypot(*(hd-bd))), int(np.hypot(*(hg-bg))))  # hauteur cible
    dst = np.array([[0,0],[larg-1,0],[larg-1,haut-1],[0,haut-1]], dtype="float32")  # rectangle cible
    M = cv2.getPerspectiveTransform(rect, dst)            # matrice de transformation
    return cv2.warpPerspective(image, M, (larg, haut))    # image redressée

def detecter_document(image, hauteur=500, aire_min_ratio=0.2):
    """Trouve les 4 coins du document, ou None."""
    ratio = image.shape[0]/float(hauteur)                 # facteur de réduction
    petit = cv2.resize(image, (int(image.shape[1]/ratio), hauteur))  # image réduite
    gris = cv2.bilateralFilter(cv2.cvtColor(petit, cv2.COLOR_BGR2GRAY), 9, 75, 75)  # gris + lissage
    bords = cv2.dilate(cv2.Canny(gris, 50, 200),          # contours + dilatation
                       cv2.getStructuringElement(cv2.MORPH_RECT,(5,5)), iterations=1)
    contours,_ = cv2.findContours(bords, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)  # contours
    for c in sorted(contours, key=cv2.contourArea, reverse=True)[:5]:  # 5 plus grands
        approx = cv2.approxPolyDP(c, 0.02*cv2.arcLength(c,True), True)  # simplification
        if len(approx)==4 and cv2.contourArea(c) > aire_min_ratio*petit.shape[0]*petit.shape[1]:
            return approx.reshape(4,2).astype("float32")*ratio  # coins à l'échelle originale
    return None

def corriger_inclinaison(image, angle_max=15.0):
    """Redresse une légère inclinaison du texte (petits angles)."""
    gris = cv2.bitwise_not(cv2.cvtColor(image, cv2.COLOR_BGR2GRAY))  # texte clair/fond sombre
    seuil = cv2.threshold(gris, 0, 255, cv2.THRESH_BINARY|cv2.THRESH_OTSU)[1]  # binarisation
    coords = np.column_stack(np.where(seuil>0))           # pixels de texte
    if coords.shape[0] < 50: return image                 # trop peu -> on ne touche pas
    angle = cv2.minAreaRect(coords)[-1]                   # angle du rectangle englobant
    angle = -(90+angle) if angle < -45 else -angle        # normalisation
    if abs(angle) > angle_max: return image               # angle suspect -> on ignore
    (h,w) = image.shape[:2]                               # dimensions
    M = cv2.getRotationMatrix2D((w//2,h//2), angle, 1.0)  # matrice de rotation
    return cv2.warpAffine(image, M, (w,h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

def ameliorer_qualite(image):
    """Uniformise l'éclairage (CLAHE), débruite, renforce la netteté — POUR L'OCR."""
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)          # espace LAB
    L,a,b = cv2.split(lab)                                # luminosité isolée
    L = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8)).apply(L)  # égalisation locale
    image = cv2.cvtColor(cv2.merge((L,a,b)), cv2.COLOR_LAB2BGR)      # retour BGR
    
    # --- OPTIMISATION --- 
    # Remplacé le filtre bilatéral (très lent) par un unsharp mask simple et rapide
    flou = cv2.GaussianBlur(image, (0, 0), 3)
    return cv2.addWeighted(image, 1.5, flou, -0.5, 0)

def nettete_brute(image, largeur_cible=1000):
    """Netteté mesurée sur l'image BRUTE, à taille normalisée (seuil comparable)."""
    h,w = image.shape[:2]                                 # dimensions d'origine
    img = cv2.resize(image, (largeur_cible, int(h*largeur_cible/w)))  # taille normalisée
    return cv2.Laplacian(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var()  # variance

def pretraiter(chemin_ou_image, ameliorer=True, max_dim=800):
    """Renvoie (image_pour_ocr, nettete_brute). Accepte un chemin ou une image."""
    if isinstance(chemin_ou_image, str):                  # chemin de fichier
        image = cv2.imread(chemin_ou_image)               # chargement
        if image is None: raise FileNotFoundError(chemin_ou_image)
    else:
        image = chemin_ou_image.copy()                    # image déjà en mémoire
        
    # --- OPTIMISATION DE PERFORMANCE : REDIMENSIONNEMENT ---
    # Réduit drastiquement le temps d'exécution (OCR + filtres OpenCV) sur CPU
    h, w = image.shape[:2]
    if max(h, w) > max_dim:
        scale = max_dim / float(max(h, w))
        image = cv2.resize(image, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
        
    qualite = nettete_brute(image)                        # netteté AVANT amélioration
    coins = detecter_document(image)                      # détection des coins
    doc = transformation_4_points(image, coins) if coins is not None else image  # cadrage (ou repli)
    doc = corriger_inclinaison(doc)                       # redressement du texte
    if ameliorer: doc = ameliorer_qualite(doc)            # amélioration pour l'OCR
    return doc, qualite                                   # image traitée + score de netteté brut

def norm(t):
    """Majuscules + suppression des accents (É->E)."""
    t = unicodedata.normalize('NFD', t.upper())           # décompose les accents
    return ''.join(c for c in t if unicodedata.category(c) != 'Mn')  # retire les accents

def joindre(zones):
    """Concatène le texte de toutes les zones en un bloc normalisé."""
    return ' '.join(norm(z["texte"]) for z in zones)

MOTS_CLES = {
    "PASSEPORT":      ["PASSEPORT", "PASSPORT"],
    "CNI":            ["CARTE D IDENTITE", "CEDEAO", "ECOWAS IDENTITY CARD",
                       "IDENTITY CARD", "BILHETE DE IDENTIDADE"],
    "CARTE_ELECTEUR": ["CARTE D ELECTEUR", "ELECTEUR", "CENI", "BUREAU DE VOTE"],
}

def identifier_type(zones, type_mrz=None):
    """Renvoie (type, scores). type_mrz vient de la MRZ si détectée."""
    blob = joindre(zones)                                 # bloc de texte normalisé
    scores = {t: 0.0 for t in MOTS_CLES}                  # score par type
    for tp, mots in MOTS_CLES.items():                    # pour chaque type
        for m in mots:                                    # pour chaque mot-clé
            s = fuzz.partial_ratio(m, blob)               # ressemblance 0-100
            if s >= 85:                                   # seuil strict
                scores[tp] = max(scores[tp], s)           # meilleur match (pas de cumul)
    if type_mrz:                                          # indice MRZ (très fiable)
        scores[type_mrz] += 100                           # gros bonus
    tp = max(scores, key=scores.get)                      # type au score max
    return (tp if scores[tp] > 0 else "INCONNU"), scores  # INCONNU si aucun indice

MRZ_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<"     # caractères autorisés en MRZ

def nettoyer_mrz(t):
    """Remplace tout caractère non-MRZ par '<' (les < sont souvent mal lus)."""
    t = t.upper().replace(" ", "")                        # majuscules, sans espaces
    return ''.join(c if c in MRZ_CHARS else '<' for c in t)  # normalise en caractères MRZ

def extraire_lignes_mrz(zones):
    """Repère et renvoie les lignes MRZ, triées du haut vers le bas.
    Utilise est_ligne_mrz (règle unique) pour rester cohérent avec le reste du pipeline."""
    cand = []                                             # lignes candidates
    for z in zones:                                       # pour chaque zone OCR
        if est_ligne_mrz(z["texte"]):                     # détection MRZ par contenu (TD1 ET TD3, avec/sans '<')
            cand.append((z["cy"], nettoyer_mrz(z["texte"])))  # (position, ligne nettoyée)
    cand.sort()                                           # tri par position verticale
    return [ligne for _cy, ligne in cand]

def check_digit_icao(chaine):
    """Chiffre de contrôle ICAO (pondération cyclique 7-3-1) — permet de VÉRIFIER l'OCR."""
    poids = [7, 3, 1]; total = 0                          # pondération cyclique
    for i, c in enumerate(chaine):                        # pour chaque caractère
        if c.isdigit(): v = int(c)                        # chiffre = sa valeur
        elif 'A' <= c <= 'Z': v = ord(c) - 55             # A=10 ... Z=35
        else: v = 0                                       # '<' = 0
        total += v * poids[i % 3]                          # somme pondérée
    return str(total % 10)                                # chiffre de contrôle

def _aammjj(s, future=False):
    """Convertit une date MRZ AAMMJJ en JJ/MM/AAAA."""
    try:
        aa, mm, jj = int(s[0:2]), int(s[2:4]), int(s[4:6])  # découpe
        siecle = 2000 if (future or aa <= 30) else 1900   # 86->1986 ; expiration 29->2029
        return f"{jj:02d}/{mm:02d}/{siecle+aa}"
    except Exception:
        return None

def lire_mrz(lignes):
    """Décode une MRZ TD1 (3 lignes, CNI) ou TD3 (2 lignes, passeport). Renvoie un dict ou None."""
    if len(lignes) >= 3 and lignes[0].startswith("I"):    # ----- TD1 (CNI) -----
        l1, l2, l3 = lignes[0], lignes[1], lignes[2]      # lignes 1, 2 et 3
        noms = l3.split("<<")                             # nom<<prenom
        dob, dob_cd = l2[0:6], (l2[6] if len(l2) > 6 else "")   # naissance + son chiffre de contrôle
        exp, exp_cd = l2[8:14], (l2[14] if len(l2) > 14 else "")  # expiration + son chiffre de contrôle
        # Numéro d'identité guinéen (16 chiffres) : positions 6-14 de L1 + champ optionnel.
        # Le champ optionnel se termine par 1 caractère de remplissage (non conservé) :
        # partie1 (9 chiffres) + optionnel[:-1] = les 16 chiffres du recto.
        partie1 = l1[5:14].replace("<", "")               # positions 6-14 (9 chiffres)
        optionnel = l1[15:].replace("<", "")              # champ optionnel (extension)
        numero = (partie1 + optionnel[:-1]) if len(optionnel) > 1 else partie1  # 16 chiffres attendus
        # Validation par chiffres de contrôle ICAO (True = OCR vérifié)
        checks = {
            "naissance":  (check_digit_icao(dob) == dob_cd) if dob_cd.isdigit() else None,
            "expiration": (check_digit_icao(exp) == exp_cd) if exp_cd.isdigit() else None,
        }
        return {
            "type": "CNI", "type_mrz": "TD1",
            "nom":            noms[0].replace("<", " ").strip(),
            "prenom":         (noms[1].replace("<", " ").strip() if len(noms) > 1 else ""),
            "date_naissance": _aammjj(dob),               # positions 1-6
            "sexe":           l2[7] if len(l2) > 7 else None,   # position 8
            "date_expiration":_aammjj(exp, future=True),   # positions 9-14
            "nationalite":    l2[15:18] if len(l2) > 17 else None,  # positions 16-18
            "numero":         numero or None,             # numéro reconstruit
            "checks":         checks,                     # résultats de validation
        }
    # ----- TD3 (passeport) : on identifie les lignes par CONTENU (robuste à l'ordre) -----
    ligne_noms = next((l for l in lignes if l.startswith("P")), None)            # ligne 'P<...' = noms
    ligne_data = next((l for l in lignes if not l.startswith("P") and len(l) >= 28), None)  # ligne données
    if ligne_noms and ligne_data:
        l1 = ligne_noms.ljust(44, "<")                    # on complète à 44 caractères (TD3)
        l2 = ligne_data.ljust(44, "<")                    # (l'OCR perd parfois des remplisseurs)
        noms = l1[5:].split("<<")                         # après P<GIN : nom<<prenom
        dob, dob_cd = l2[13:19], l2[19]                   # naissance + son chiffre de contrôle
        exp, exp_cd = l2[21:27], l2[27]                   # expiration + son chiffre de contrôle
        checks = {
            "naissance":  (check_digit_icao(dob) == dob_cd) if dob_cd.isdigit() else None,
            "expiration": (check_digit_icao(exp) == exp_cd) if exp_cd.isdigit() else None,
        }
        return {
            "type": "PASSEPORT", "type_mrz": "TD3",
            "nom":            noms[0].replace("<", " ").strip(),
            "prenom":         (noms[1].replace("<", " ").strip() if len(noms) > 1 else ""),
            "numero":         l2[0:9].replace("<", ""),   # n° passeport
            "nationalite":    l2[10:13],
            "date_naissance": _aammjj(dob),               # positions 14-19
            "sexe":           l2[20],                     # position 21
            "date_expiration":_aammjj(exp, future=True),   # positions 22-27
            "checks":         checks,                     # résultats de validation
        }
    return None                                           # pas de MRZ exploitable

# --- Motifs ---
MOIS = {"JAN":1,"FEB":2,"FEV":2,"MAR":3,"APR":4,"AVR":4,"MAY":5,"MAI":5,"JUN":6,"JUIN":6,
        "JUL":7,"JUIL":7,"AUG":8,"AOU":8,"SEP":9,"OCT":10,"NOV":11,"DEC":12}
PAT_DATE_TXT = re.compile(r"\b(\d{1,2})\s+([A-Z]{3,4})\s+(\d{4})\b")  # 26 DEC 1986
PAT_DATE_NUM = re.compile(r"\b(\d{2})[\s./\-](\d{2})[\s./\-](\d{4})\b")  # 26/12/1986
PAT_NUM16 = re.compile(r"\b\d{16}\b")                  # numéro d'identité (recto)
PAT_NIN   = re.compile(r"\b\d{15}\b")                  # NIN (verso)

def trouver_dates(blob):
    """Toutes les dates en JJ/MM/AAAA (formats lettres ET chiffres)."""
    dates = []
    for j,m,a in PAT_DATE_TXT.findall(blob):              # format '26 DEC 1986'
        if m[:3] in MOIS: dates.append(f"{int(j):02d}/{MOIS[m[:3]]:02d}/{a}")
    for j,m,a in PAT_DATE_NUM.findall(blob):              # format '26/12/1986'
        dates.append(f"{int(j):02d}/{int(m):02d}/{a}")
    return dates

LIBELLES = ["SURNAME","FIRST NAME","NATIONALITY","DATE OF BIRTH","SEX","HEIGHT",
            "PLACE OF ISSUANCE","NOM","PRENOM","TAILLE","LIEU DE NAISSANCE",
            "REGION","COMMUNE","DISTRICT","BUREAU DE VOTE"]
def est_libelle(txt):
    """Vrai si le texte est un libellé (et non une valeur)."""
    if len(txt.strip()) <= 2: return False                # F, M, 02... = valeurs
    n = norm(txt)
    return "/" in txt or any(fuzz.ratio(l, n) >= 80 for l in LIBELLES)  # ratio GLOBAL

# Mots du bandeau décoratif de la CNI (jamais dans une vraie MRZ)
MOTS_BANDEAU = ("TRAVAIL","JUSTICE","SOLIDARITE","SOLIDARIT","JUATICE","JUBTICE","JUUTOB","JSTICE")

def est_ligne_mrz(texte):
    """Détecte une ligne MRZ par son CONTENU (indépendant de la position/résolution).
    Discriminants : une MRZ n'a NI espace NI minuscule NI tiret ; elle est longue et dense.
    - longue (>=28 car.) et dense -> MRZ même sans '<' (remplisseurs parfois lus comme des chiffres)
    - courte -> on exige un '<' (pour écarter le NIN, 15 chiffres sans '<')."""
    brut = texte.strip().replace(" ", "")                 # on retire les espaces internes (parasites OCR)
    if any(c.islower() for c in brut):                    # une minuscule -> pas une MRZ
        return False
    t = brut.upper()
    if "-" in t:                                          # une MRZ n'a jamais de tiret (le bandeau si)
        return False
    if any(mot in t for mot in MOTS_BANDEAU):             # rejette le bandeau TRAVAIL-JUSTICE-SOLIDARITE
        return False
    if len(t) < 15:                                       # trop court pour une ligne MRZ
        return False
    if sum(c in MRZ_CHARS for c in t) / len(t) <= 0.7:    # pas assez dense en caractères MRZ
        return False
    if len(t) >= 28:                                      # ligne MRZ longue (TD1=30, TD3=44)
        return True
    return "<" in t                                       # ligne courte : '<' obligatoire (écarte le NIN)

def valeur_sous_libelle(zones, libelles, seuil=80, tol_rxg=0.06):
    """Recto : la valeur est la zone juste EN DESSOUS du libellé, alignée à gauche.
    Positions RELATIVES (fractions) -> robuste à la taille/résolution de l'image."""
    for z in zones:                                       # cherche la zone-libellé
        if any(fuzz.partial_ratio(l, norm(z["texte"])) >= seuil for l in libelles):
            cand = [a for a in zones                       # candidats valeur
                    if a["ry"] > z["ry"]                   # en dessous (relatif)
                    and abs(a["rxg"] - z["rxg"]) < tol_rxg # même colonne (relatif)
                    and not est_libelle(a["texte"])        # pas un autre libellé
                    and not est_ligne_mrz(a["texte"])]     # pas une ligne MRZ
            if cand:
                return min(cand, key=lambda a: a["ry"]-z["ry"])["texte"]  # la plus proche
    return None

def valeur_a_droite(zones, libelles, seuil=80, tol_ry=0.035):
    """Verso : la valeur est la zone À DROITE du libellé, sur la même ligne (relatif)."""
    for z in zones:
        if any(fuzz.partial_ratio(l, norm(z["texte"])) >= seuil for l in libelles):
            cand = [a for a in zones
                    if a["rx"] > z["rx"] + 0.015           # à droite (relatif)
                    and abs(a["ry"] - z["ry"]) < tol_ry    # même ligne (relatif)
                    and not est_libelle(a["texte"])
                    and not est_ligne_mrz(a["texte"])]
            if cand:
                return min(cand, key=lambda a: a["rx"]-z["rx"])["texte"]  # la plus proche
    return None

# Libellés de la carte d'électeur, du PLUS LONG au plus court
# (les longs d'abord : évite que "Nom" ne rafle "Numéro" ou "Prénom")
LIBELLES_ELECT = ["Numéro de carte","Date d'expiration","Centre de vote","Bureau de vote",
                  "District/Quartier","Préfecture","Identifiant","Prénom(s)","Adresse",
                  "Région","Secteur","Né(e) le","Sexe","Nom"]

def _valeur_origine(fragment, libelle):
    """Valeur en préservant la casse : coupe sur ':' si présent, sinon retire le libellé du début."""
    if ":" in fragment:                                   # cas normal : 'Nom: DIALLO'
        return fragment.split(":", 1)[1].strip() or None
    lib_len = len(libelle.replace(" ", ""))               # cas flou : 'NomMARAH' (':' effacé)
    return fragment.replace(" ", "")[lib_len:].strip(":.- ") or None

def valeur_champ(frags, libelle, seuil=80):
    """Trouve la valeur d'un libellé, avec ':' OU sans ':' (OCR flou)."""
    lib_n = norm(libelle).replace(" ", "")                # libellé normalisé compact
    meilleur_val, meilleur_score = None, 0
    for f in frags:
        compact = norm(f).replace(" ", "")                # fragment normalisé compact
        if compact.startswith(lib_n):                     # le fragment commence par le libellé
            return _valeur_origine(f, libelle)            # match direct = fiable
        score = fuzz.ratio(lib_n, compact[:len(lib_n)+2]) # sinon fuzzy sur le début (tolère l'OCR)
        if score >= seuil and score > meilleur_score:
            meilleur_val, meilleur_score = _valeur_origine(f, libelle), score
    return meilleur_val

def _naissance_electeur(frags):
    """Sépare 'Né(e) le: JJ/MM/AAAA à LIEU' en date + lieu."""
    v = valeur_champ(frags, "Né(e) le")
    if not v: return None, None
    m = re.search(r"(\d{2}/\d{2}/\d{4})", v)             # la date
    date = m.group(1) if m else None
    lieu = re.split(r"\s+[àa]\s+", v, flags=re.I)[-1].strip() if re.search(r"\s[àa]\s", v, re.I) else None
    return date, lieu

def extraire_champs_electeur(frags):
    """Extrait tous les champs de la carte d'électeur."""
    date_n, lieu_n = _naissance_electeur(frags)
    return {
        "identifiant":     valeur_champ(frags, "Identifiant"),
        "nom":             valeur_champ(frags, "Nom"),
        "prenom":          valeur_champ(frags, "Prénom(s)"),
        "date_naissance":  date_n,
        "lieu_naissance":  lieu_n,
        "sexe":            valeur_champ(frags, "Sexe"),
        "adresse":         valeur_champ(frags, "Adresse"),
        "prefecture":      valeur_champ(frags, "Préfecture"),
        "centre_vote":     valeur_champ(frags, "Centre de vote"),
        "bureau_vote":     valeur_champ(frags, "Bureau de vote"),
        "date_expiration": valeur_champ(frags, "Date d'expiration"),
        "numero_carte":    valeur_champ(frags, "Numéro de carte"),
    }

from datetime import datetime

# Formats officiels (permettent de DÉTECTER une erreur OCR)
PAT_ID_ELECT  = re.compile(r"^\d{5}[A-Z]{3}\d{10}$")     # ex 28611MMU0206000166
PAT_NUM_ELECT = re.compile(r"^\d{9}$")                    # ex 061253500

def valider_electeur(champs):
    """Valide identifiant + numéro + cohérence des dates. Renvoie erreurs + clé unique croisée."""
    aujourdhui = datetime.now()                           # date du jour
    erreurs = []
    ident = (champs.get("identifiant") or "").replace(" ", "").upper()
    num   = (champs.get("numero_carte") or "").replace(" ", "")

    if not PAT_ID_ELECT.match(ident):                     # identifiant mal formé (souvent = OCR flou)
        erreurs.append(f"Identifiant mal formé : '{ident}'")
    if not PAT_NUM_ELECT.match(num):                      # numéro mal formé
        erreurs.append(f"Numéro de carte mal formé : '{num}'")

    def _parse(d):                                        # parse une date JJ/MM/AAAA
        try: return datetime.strptime(d or "", "%d/%m/%Y")
        except: return None
    dn, de = _parse(champs.get("date_naissance")), _parse(champs.get("date_expiration"))
    if dn:                                                # cohérence de l'âge
        age = (aujourdhui - dn).days // 365
        if age < 18:  erreurs.append(f"Âge {age} < 18 ans")
        if age > 120: erreurs.append(f"Âge {age} aberrant")
    if de and de < aujourdhui:                            # carte expirée
        erreurs.append(f"Carte expirée ({champs.get('date_expiration')})")

    # Clé unique CROISÉE : identifiant + numéro (les deux doivent être valides)
    cle = f"{ident}|{num}" if (PAT_ID_ELECT.match(ident) and PAT_NUM_ELECT.match(num)) else None
    return {"erreurs": erreurs, "cle_unique": cle}

def apparier_verso_empile(zones, libelles):
    """Verso CNI : libellés (colonne gauche) et valeurs (colonne centrale empilée)
    sont appariés par ORDRE VERTICAL (le i-ème libellé <-> la i-ème valeur)."""
    if not zones: return {}
    xs = sorted(z["cx"] for z in zones)                   # toutes les positions horizontales
    seuil_x = (xs[0] + xs[-1]) / 2                        # frontière gauche / centre
    col_gauche = sorted([z for z in zones if z["cx"] <  seuil_x], key=lambda z: z["cy"])  # libellés
    col_droite = sorted([z for z in zones if z["cx"] >= seuil_x], key=lambda z: z["cy"])  # valeurs
    resultat = {}
    for lib in libelles:                                  # pour chaque libellé cherché
        rang = None
        for i, z in enumerate(col_gauche):                # on trouve son rang dans la colonne gauche
            if fuzz.partial_ratio(lib, norm(z["texte"])) >= 80:
                rang = i; break
        if rang is not None and rang < len(col_droite):   # même rang dans la colonne des valeurs
            resultat[lib] = col_droite[rang]["texte"]
    return resultat

def _est_valeur_maj(texte):
    """Une VALEUR de la carte est en MAJUSCULES ; un LIBELLÉ est en casse mixte (a des minuscules)."""
    lettres = [c for c in texte if c.isalpha()]
    if not lettres:
        return False
    return not any(c.islower() for c in lettres)          # aucune minuscule = valeur

def _lieu_delivrance_cni(zones):
    """Recto CNI : le lieu de délivrance ('CONAKRY / M.S.P.C') suit le libellé
    'Lieu de délivrance / Place of issuance'. On prend la zone EN DESSOUS qui est en
    MAJUSCULES (comme toutes les valeurs) et n'est pas une date. Ce critère de casse
    écarte les libellés bilingues (qui contiennent tous un '/' mais sont en casse mixte)."""
    for z in zones:                                       # on cherche d'abord le libellé
        if fuzz.partial_ratio("PLACE OF ISSUANCE", norm(z["texte"])) >= 80 or            fuzz.partial_ratio("LIEU DE DELIVRANCE", norm(z["texte"])) >= 80:
            cand = [a for a in zones                       # valeur = zone en dessous, en majuscules
                    if a["ry"] > z["ry"]
                    and _est_valeur_maj(a["texte"])        # MAJUSCULES (donc pas un libellé)
                    and not re.search(r"\d{4}", a["texte"])  # pas une date
                    and len(norm(a["texte"])) >= 4]
            if cand:
                return min(cand, key=lambda a: a["ry"] - z["ry"])["texte"]  # la plus proche en dessous
    return None

# Mots appartenant aux LIBELLÉS du verso (jamais des valeurs) — pour ne pas les confondre
MOTS_LIBELLE_VERSO = {"LIEU","DE","NAISSANCE","DENAISSANCE","REGION","REGIONTREGION",
                      "SOUS","PREFECTURE","COMMUNE","QUARTIER","DISTRICT","SECTEUR","VILLAGE"}

# Mots d'EN-TÊTE / AUTORITÉ du verso — un fragment qui en contient n'est jamais une valeur
MOTS_PARASITES = {"NATIONALE","DIRECTEUR","GENERAL","POLICE","AUTORITE","DELIVRANCE",
                  "REPUBLIQUE","GUINEE","CODE","PAYS","PREFECTURE","PRECTURE"}

def est_parasite(texte):
    """Vrai si le fragment contient un mot d'en-tête/autorité (ex 'Police Nationale')."""
    return bool(set(norm(texte).split()) & MOTS_PARASITES)

def _espacement_lignes(zones):
    """Mesure l'espacement vertical MÉDIAN entre lignes de texte (relatif) — hors MRZ."""
    ys = sorted(set(round(z["ry"], 4) for z in zones if not est_ligne_mrz(z["texte"])))
    diffs = [b - a for a, b in zip(ys, ys[1:]) if b - a > 0.005]   # écarts entre lignes voisines
    if not diffs:
        return 0.05                                       # valeur de repli si une seule ligne
    diffs.sort()
    return diffs[len(diffs) // 2]                          # médiane des écarts

def valeur_verso(zones, libelle, seuil=78, gap_rx=0.015):
    """Verso CNI : valeur d'un libellé, en POSITIONS RELATIVES et tolérance ADAPTATIVE.
    - tol_ry = 60% de l'espacement inter-lignes RÉEL mesuré sur la carte -> robuste à toute résolution.
    - Cas A : valeur COLLÉE au libellé ('Commune TOMBOLIA'). Cas B : valeur à droite, même ligne.
    - La MRZ est ignorée par son CONTENU (est_ligne_mrz)."""
    lib_n = norm(libelle)
    tol_ry = _espacement_lignes(zones) * 0.95             # tolérance verticale élargie (95% de l'espacement)
    for z in zones:                                       # on cherche le fragment-libellé
        if est_ligne_mrz(z["texte"]):                     # on saute la MRZ (par contenu)
            continue
        if fuzz.partial_ratio(lib_n, norm(z["texte"])) >= seuil:  # libellé trouvé
            mots = z["texte"].split()
            dernier = mots[-1] if mots else ""
            # Cas A : dernier mot du fragment = une vraie valeur (pas un mot de libellé/parasite)
            if len(mots) >= 2 and norm(dernier) not in MOTS_LIBELLE_VERSO and len(dernier) >= 3                and not est_parasite(z["texte"]):
                return dernier
            # Cas B : valeur sur la même ligne, à droite, ni libellé ni MRZ ni parasite
            cand = [a for a in zones
                    if not est_ligne_mrz(a["texte"])
                    and abs(a["ry"] - z["ry"]) < tol_ry                          # même ligne (tolérance élargie)
                    and a["rx"] > z["rx"] + gap_rx                               # à droite (relatif)
                    and norm(a["texte"].split()[0]) not in MOTS_LIBELLE_VERSO    # pas un libellé
                    and not est_parasite(a["texte"])]                           # pas un en-tête/autorité
            if cand:
                return min(cand, key=lambda a: a["rx"] - z["rx"])["texte"]  # la plus proche à droite
    return None

def extraire_champs(type_piece, zones_recto, zones_verso, champs_mrz):
    """Fusionne MRZ + position + motifs selon le type de document."""
    champs = {}                                           # résultat

    # 1) MRZ prioritaire. Les DATES ne sont retenues que si leur chiffre de contrôle PASSE
    #    (sinon la MRZ a été mal lue -> on refuse la valeur plutôt que d'accepter une fausse date).
    if champs_mrz:
        checks = champs_mrz.get("checks", {})             # résultats de validation ICAO
        for k in ("nom","prenom","sexe","nationalite"):   # champs texte : on prend tels quels
            if champs_mrz.get(k): champs[k] = champs_mrz[k]
        if champs_mrz.get("date_naissance") and checks.get("naissance") is True:
            champs["date_naissance"] = champs_mrz["date_naissance"]   # naissance fiable
        if champs_mrz.get("date_expiration") and checks.get("expiration") is True:
            champs["date_expiration"] = champs_mrz["date_expiration"] # expiration fiable

    blob_recto = joindre(zones_recto)                     # bloc recto normalisé
    dates = trouver_dates(blob_recto)                     # dates du recto

    # 2) Compléments par position / motifs (si la MRZ n'a pas fourni)
    champs.setdefault("nom",         valeur_sous_libelle(zones_recto, ["SURNAME","NOM"]))
    champs.setdefault("prenom",      valeur_sous_libelle(zones_recto, ["FIRST NAME","PRENOM"]))
    champs.setdefault("nationalite", valeur_sous_libelle(zones_recto, ["NATIONALITY"]))
    champs.setdefault("sexe",        valeur_sous_libelle(zones_recto, ["SEX"]))
    if not champs.get("date_naissance") and dates:
        champs["date_naissance"] = dates[0]               # 1re date = naissance

    # Numéro d'identité 16 chiffres (recto), sinon depuis la MRZ (recouvert par la pastille holo)
    m = PAT_NUM16.search(blob_recto.replace(" ", ""))
    champs["numero_identite"] = m.group() if m else (champs_mrz.get("numero") if champs_mrz else None)

    # 3) Champs spécifiques au type
    if type_piece == "CNI":
        if len(dates) >= 3:                               # naissance, émission, expiration
            champs.setdefault("date_emission",   dates[1])
            champs.setdefault("date_expiration", dates[2])
        # Lieu de délivrance : c'est le TEXTE en bas (contient un '/' comme "CONAKRY / M.S.P.C"),
        # pas une date -> on cherche un fragment avec '/' qui n'est pas une date
        champs["lieu_delivrance"] = _lieu_delivrance_cni(zones_recto)
        if zones_verso:                                   # verso administratif (valeurs empilées)
            champs["lieu_naissance"] = valeur_verso(zones_verso, "LIEU DE NAISSANCE")
            champs["region"]         = valeur_verso(zones_verso, "REGION")
            champs["commune"]        = valeur_verso(zones_verso, "COMMUNE")
            champs["quartier"]       = valeur_verso(zones_verso, "QUARTIER") or valeur_verso(zones_verso, "DISTRICT")
            champs["secteur"]        = valeur_verso(zones_verso, "SECTEUR") or valeur_verso(zones_verso, "VILLAGE")
            mnin = PAT_NIN.search(joindre(zones_verso).replace(" ", ""))
            champs["nin"] = mnin.group() if mnin else None
    elif type_piece == "CARTE_ELECTEUR":                  # recto seul, pas de MRZ
        # Extracteur DÉDIÉ (layout "libellé: valeur" sur une même ligne, ':' parfois perdu)
        champs.update(extraire_electeur(zones_recto))     # champs propres à la carte d'électeur
    elif type_piece == "PASSEPORT":
        if champs_mrz and champs_mrz.get("numero"):
            champs["numero_identite"] = champs_mrz["numero"]     # n° de passeport (MRZ)
        # Numéro personnel (NIN, 15 chiffres) : cherché dans le VIZ (hors lignes MRZ)
        blob_viz = "".join(z["texte"] for z in zones_recto if not est_ligne_mrz(z["texte"]))
        mperso = re.search(r"\d{15}", blob_viz.replace(" ", ""))
        champs["numero_personnel"] = mperso.group() if mperso else None
        # Champs visuels (valeur en MAJUSCULES sous le libellé bilingue)
        champs["lieu_naissance"] = valeur_sous_libelle(zones_recto, ["PLACE OF BIRTH","LIEU DE NAISSANCE"])
        champs["autorite"]       = valeur_sous_libelle(zones_recto, ["AUTHORITY","AUTORITE"])

    return champs

from datetime import datetime                          # pour valider les dates

AUJOURD_HUI = datetime.now()                             # date de référence dynamique (toujours aujourd'hui)

def _valeur_origine(fragment, libelle):
    """Renvoie la valeur après le libellé, avec ou sans ':' (casse d'origine préservée)."""
    if ":" in fragment:                                  # cas normal : 'Nom: DIALLO'
        return fragment.split(":", 1)[1].strip() or None
    lib_len = len(libelle.replace(" ", ""))              # cas flou : 'NomDIALLO' (':' perdu)
    return fragment.replace(" ", "")[lib_len:].strip(":.- ") or None

# Libellés de la carte d'électeur -> clé du champ correspondant
LIBELLES_ELECTEUR = {
    "IDENTIFIANT":"identifiant", "PRENOMS":"prenom", "PRENOM":"prenom", "NOM":"nom",
    "NEE LE":"naissance", "NE LE":"naissance", "SEXE":"sexe",
    "ADRESSE":"adresse", "REGION":"region", "PREFECTURE":"prefecture",
    "DISTRICT QUARTIER":"quartier", "DISTRICTQUARTIER":"quartier", "SECTEUR":"secteur",
    "CENTRE DE VOTE":"centre_vote", "BUREAU DE VOTE":"bureau_vote",
    "DATE D EXPIRATION":"date_expiration", "NUMERO DE CARTE":"numero_carte",
}

def _est_libelle_electeur(txt):
    n = norm(txt).replace(":", "").replace(".", "").strip().replace(" ", "")
    for lib, cle in LIBELLES_ELECTEUR.items():
        lc = lib.replace(" ", "")
        if n.startswith(lc) or fuzz.ratio(lc, n[:len(lc)]) >= 85:
            return cle, lib
    return None, None

def _valeur_collee_electeur(txt, lib):
    m = re.split(r"[:.]", txt, maxsplit=1)
    if len(m) > 1:
        v = m[1].strip()
        if v and re.search(r"[A-Za-zÀ-ÿ0-9]{2,}", v):
            return v
    reste = txt
    for mot in lib.split():
        reste = re.sub(r"(?i)^\W*" + re.escape(mot) + r"\W*", "", reste, count=1)
    reste = reste.strip(" :.()s")
    return reste if len(reste) >= 2 and re.search(r"[A-Za-zÀ-ÿ0-9]{2,}", reste) else None

def extraire_electeur(zones):
    """On lit TOUT dans l'ordre ; pour chaque libellé on prend la valeur qui SUIT (en sautant
    les autres libellés/parasites). Aucune position -> robuste à l'angle. Les champs à format fixe
    (identifiant, dates, numéro) sont confirmés par MOTIF."""
    # Arrondir la position verticale (ry) par pas de 2% pour grouper les textes de la même ligne
    seq = [z["texte"] for z in sorted(zones, key=lambda z: (round(z["ry"] / 0.02), z["rx"]))]
    champs = {}
    i = 0
    while i < len(seq):
        cle, lib = _est_libelle_electeur(seq[i])
        if cle and cle != "naissance":
            v = _valeur_collee_electeur(seq[i], lib)
            if v and not _est_libelle_electeur(v)[0]:
                champs.setdefault(cle, v)
            else:
                j = i + 1
                while j < len(seq):
                    if _est_libelle_electeur(seq[j])[0]:
                        break
                    cand = seq[j].strip()
                    if cand not in ("à", "X", "C", "S", "-") and len(norm(cand)) >= 2:
                        champs.setdefault(cle, cand); break
                    j += 1
        i += 1
    blob = " ".join(seq); nb = norm(blob)
    for tok in re.findall(r"[A-Z0-9]{14,20}", nb):
        if 16 <= len(tok) <= 19 and sum(c.isalpha() for c in tok) >= 2 and sum(c.isdigit() for c in tok) >= 8:
            champs["identifiant"] = tok; break
    dates = re.findall(r"\b(\d{2}/\d{2}/\d{4})\b", blob)
    m_exp = re.search(r"EXPIRATION\D{0,12}(\d{2}/\d{2}/\d{4})", nb)
    champs["date_expiration"] = m_exp.group(1) if m_exp else champs.get("date_expiration")
    champs["date_naissance"] = next((d for d in dates if d != champs.get("date_expiration")), None)
    m_num = re.search(r"NUMERO DE CARTE\D{0,5}(\d{8,10})", nb)
    if m_num: champs["numero_carte"] = m_num.group(1)
    if re.search(r"FEMININ", nb):   champs["sexe"] = "Feminin"
    elif re.search(r"MASCULIN", nb): champs["sexe"] = "Masculin"
    m_lieu = re.search(r"\d{2}/\d{2}/\d{4}\s+[àa]\s+([A-Za-zÀ-ÿ]+)", blob)
    champs["lieu_naissance"] = m_lieu.group(1) if m_lieu else None

    return champs

def _parse_date(d):
    """Parse une date JJ/MM/AAAA ou renvoie None."""
    try: return datetime.strptime(d, "%d/%m/%Y")
    except Exception: return None

def _valide_identifiant(x):
    """Identifiant électeur = 18 caractères alphanumériques dont des lettres."""
    x = (x or "").replace(" ", "").upper()
    return len(x) == 18 and x.isalnum() and sum(c.isalpha() for c in x) >= 2

def valider_electeur(champs):
    """Contrôles de cohérence (seule redondance en l'absence de MRZ). Renvoie la liste des problèmes."""
    p = []                                               # problèmes détectés
    if not _valide_identifiant(champs.get("identifiant")):
        p.append(f"Identifiant douteux ({champs.get('identifiant')})")
    num = (champs.get("numero_carte") or "").replace(" ", "")
    if not re.match(r"^\d{9}$", num):                    # numéro de carte = 9 chiffres
        p.append(f"Numéro de carte douteux ({num or 'vide'})")
    exp = _parse_date(champs.get("date_expiration"))
    nai = _parse_date(champs.get("date_naissance"))
    if exp and exp < AUJOURD_HUI: p.append("Carte expirée")
    if nai:
        age = (AUJOURD_HUI - nai).days / 365.25          # âge en années
        if age < 18: p.append(f"Âge < 18 ans ({age:.0f})")
        if age > 120: p.append("Date de naissance improbable")
    return p

def cle_composite_electeur(champs):
    """Clé unique N'ma SIM = identifiant + numéro de carte (les deux doivent être valides)."""
    num = (champs.get("numero_carte") or "").replace(" ", "")
    if _valide_identifiant(champs.get("identifiant")) and re.match(r"^\d{9}$", num):
        return f"{champs['identifiant'].replace(' ','')}|{num}"   # clé composite
    return None                                          # clé non fiable -> vérification manuelle

# --- Initialisation UNIQUE du moteur InsightFace (si choisi) ---
_app_visage = None                                       # sera chargé à la première utilisation
def _get_insightface():
    global _app_visage
    if _app_visage is None:                              # chargement paresseux (une seule fois)
        from insightface.app import FaceAnalysis          # bibliothèque InsightFace
        prov = ["CUDAExecutionProvider","CPUExecutionProvider"] if UTILISER_GPU else ["CPUExecutionProvider"]
        _app_visage = FaceAnalysis(name="buffalo_l", providers=prov)  # détection SCRFD + reco ArcFace
        _app_visage.prepare(ctx_id=0 if UTILISER_GPU else -1, det_size=(640,640))
    return _app_visage

def _plus_grand_visage(faces):
    """Renvoie le plus grand visage détecté (évite la photo fantôme des CNI/passeports)."""
    return max(faces, key=lambda f:(f.bbox[2]-f.bbox[0])*(f.bbox[3]-f.bbox[1])) if faces else None

def verifier_visage_insightface(image_piece, image_selfie, seuil=None):
    """Compare deux visages via ArcFace. image_* = tableau image (BGR) ou chemin."""
    seuil = SEUIL_VISAGE if seuil is None else seuil
    app = _get_insightface()
    imgp = cv2.imread(image_piece) if isinstance(image_piece, str) else image_piece   # image pièce
    imgs = cv2.imread(image_selfie) if isinstance(image_selfie, str) else image_selfie # image selfie
    fp = _plus_grand_visage(app.get(imgp))               # visage de la pièce
    fs = _plus_grand_visage(app.get(imgs))               # visage du selfie
    if fp is None: return {"verifie":None,"similarite":None,"seuil":seuil,"erreur":"Aucun visage sur la pièce"}
    if fs is None: return {"verifie":None,"similarite":None,"seuil":seuil,"erreur":"Aucun visage sur le selfie"}
    # Similarité cosinus des embeddings normalisés (ArcFace) : proche de 1 = même personne
    sim = float(np.dot(fp.normed_embedding, fs.normed_embedding))
    return {"verifie": sim >= seuil, "similarite": round(sim,3), "seuil": seuil, "erreur": None}

def verifier_visage_deepface(image_piece, image_selfie, modele="Facenet"):
    """Repli DeepFace (si MOTEUR_VISAGE = 'deepface')."""
    from deepface import DeepFace
    try:
        r = DeepFace.verify(img1_path=image_piece, img2_path=image_selfie,
                            model_name=modele, detector_backend="opencv", enforce_detection=True)
        return {"verifie": bool(r["verified"]), "similarite": None,
                "distance": float(r["distance"]), "seuil": float(r["threshold"]), "erreur": None}
    except Exception as e:
        return {"verifie": None, "similarite": None, "seuil": None, "erreur": str(e)}

def verifier_visage(image_piece, image_selfie):
    """Route vers le moteur de comparaison faciale.
    Essaie InsightFace (ArcFace) en premier. Si ONNX plante (modèle corrompu),
    repli sur une détection de présence de visage via OpenCV (moins précis mais stable)."""
    # --- Tentative InsightFace ---
    try:
        if MOTEUR_VISAGE == "insightface":
            return verifier_visage_insightface(image_piece, image_selfie)
        elif MOTEUR_VISAGE == "deepface":
            return verifier_visage_deepface(image_piece, image_selfie)
    except Exception as e:
        err_msg = str(e)
        # Protobuf / ONNX corrompu -> repli OpenCV
        if "protobuf" in err_msg.lower() or "onnx" in err_msg.lower() or "arena" in err_msg.lower():
            pass  # on continue vers le repli OpenCV
        else:
            return {"verifie": None, "similarite": None, "seuil": SEUIL_VISAGE, "erreur": err_msg}

    # --- Repli OpenCV : détection de présence de visage (sans comparaison biométrique) ---
    try:
        cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        def _a_visage(img):
            if isinstance(img, str):
                img = cv2.imread(img)
            if img is None:
                return False
            gris = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            faces = cascade.detectMultiScale(gris, scaleFactor=1.1, minNeighbors=4, minSize=(60, 60))
            return len(faces) > 0

        imgp = cv2.imread(image_piece) if isinstance(image_piece, str) else image_piece
        imgs = cv2.imread(image_selfie) if isinstance(image_selfie, str) else image_selfie

        piece_a_visage = _a_visage(imgp)
        selfie_a_visage = _a_visage(imgs)

        if not piece_a_visage:
            return {"verifie": None, "similarite": None, "seuil": SEUIL_VISAGE,
                    "erreur": "Aucun visage détecté sur la pièce d'identité (Mode Dégradé)."}
        if not selfie_a_visage:
            return {"verifie": False, "similarite": None, "seuil": SEUIL_VISAGE,
                    "erreur": "Aucun visage détecté sur le selfie (Mode Dégradé)."}
        # Les deux visages sont présents mais on ne peut pas les comparer finement
        return {"verifie": None, "similarite": None, "seuil": SEUIL_VISAGE,
                "erreur": "Comparaison biométrique non disponible (Mode Dégradé). Visage détecté."}
    except Exception as e2:
        return {"verifie": None, "similarite": None, "seuil": SEUIL_VISAGE, "erreur": str(e2)}

CHAMPS_OBLIGATOIRES = {
    "CNI":            ["nom","prenom","date_naissance","numero_identite"],
    "CARTE_ELECTEUR": ["nom","prenom","date_naissance"],
    "PASSEPORT":      ["nom","prenom","date_naissance"],
    "PERMIS":         ["nom","prenom","date_naissance"],   # permis biométrique (recto seul, pas de MRZ)
    "INCONNU":        ["nom","prenom"],
}

def calculer_age(date_naissance, ref=None):
    """Calcule l'âge (en années) à partir d'une date 'JJ/MM/AAAA'. Renvoie None si illisible."""
    d = _parse_date(date_naissance) if isinstance(date_naissance, str) else None
    if d is None:
        return None
    ref = ref or AUJOURD_HUI                              # date de référence (aujourd'hui)
    age = ref.year - d.year - ((ref.month, ref.day) < (d.month, d.day))  # anniversaire passé ou non
    return age if 0 <= age <= 130 else None               # garde-fou (date aberrante)

def evaluer_risque(qualite, champs, type_piece, face, problemes_electeur=None, mrz_ok=False,
                   mrz_checks=None, liveness_selfie=None, liveness_piece=None):
    """Calcule le risque cumulé et la décision finale.
    mrz_ok=True quand une MRZ a été lue : les données identité sont fiables MÊME si l'image
    est un peu floue (la MRZ prime sur la netteté). On assouplit donc la pénalité de netteté."""
    risque = 0; details = []                              # risque et journal
    age = calculer_age(champs.get("date_naissance"))      # âge du titulaire (None si date illisible)

    # --- CONDITION D'ÂGE (règle métier SIM) ---
    # Un mineur ne peut pas obtenir de SIM à son nom -> REJET direct, quelle que soit la qualité.
    if age is not None and age < AGE_MINIMUM:
        details.append(f"Titulaire mineur : {age} ans < {AGE_MINIMUM} ans requis -> REFUS")
        return 100, "❌ REJETÉ (âge insuffisant)", details
    if age is None:
        # date de naissance illisible : on ne peut pas vérifier l'âge -> vérification manuelle
        risque += 20; details.append("Date de naissance illisible. Vérification de l'âge impossible.")
    else:
        details.append(f"Vérification de l'âge validée ({age} ans).")

    # --- VALIDITÉ DE LA PIÈCE (date d'expiration) ---
    # Une pièce périmée ne peut pas servir au KYC -> REJET, quelle que soit l'identité.
    exp = _parse_date(champs.get("date_expiration"))      # date d'expiration de la pièce
    if exp is not None:
        if exp < AUJOURD_HUI:
            details.append(f"Document expiré depuis le {champs.get('date_expiration')}.")
            return 100, "❌ REJETÉ (Document expiré)", details
        else:
            details.append(f"Validité du document confirmée (Expire le {champs.get('date_expiration')}).")

    # --- LIVENESS / ANTI-SPOOFING (KYC en ligne) ---
    # Selfie : détecte une "photo d'une photo" (présentation attack). Si c'est un faux -> REJET.
    if liveness_selfie and liveness_selfie.get("vrai") is False:
        details.append("Échec du contrôle de sécurité biométrique (Selfie invalide).")
        return 100, "❌ REJETÉ (Échec sécurité biométrique)", details
    elif liveness_selfie and liveness_selfie.get("vrai") is True:
        details.append("Contrôle de sécurité biométrique validé.")
    # Liveness : baisse de la pénalité pour les démos (scans d'écrans fréquents en test)
    if liveness_selfie and liveness_selfie.get("erreur"):
        risque += 0; details.append("Contrôle de sécurité du selfie ignoré (Mode Démo).")
    # Pièce : détecte le scan d'un écran affichant une pièce (au lieu de la vraie carte).
    if liveness_piece and liveness_piece.get("vrai") is False:
        risque += 10; details.append("Risque de fraude : Document photographié depuis un écran (Toléré en Démo).")

    # Netteté : si la MRZ a fourni les données (passeport/CNI), on tolère un peu de flou
    if mrz_ok:
        if qualite < 40:  risque += 15; details.append("Qualité d'image insuffisante (Document flou).")
        # entre 40 et l'infini : pas de pénalité, la MRZ fait foi
    else:
        if qualite < 100:  risque += 30; details.append("Qualité d'image critique (Texte illisible).")   # netteté brute
        elif qualite < 200: risque += 15; details.append("Netteté de l'image à améliorer.")

    for champ in CHAMPS_OBLIGATOIRES.get(type_piece, []):  # champs manquants
        if not champs.get(champ):
            risque += 12; details.append(f"Information requise introuvable sur le document : {champ}.")

    # Problèmes de cohérence carte d'électeur (identifiant/numéro/dates invalides)
    for pb in (problemes_electeur or []):
        risque += 15; details.append(f"Incohérence détectée sur le document : {pb}.")

    # Échec de validation MRZ (chiffre de contrôle KO = MRZ mal lue -> donnée non fiable)
    if mrz_checks:
        for champ, ok in mrz_checks.items():
            if ok is False:
                risque += 20; details.append(f"Échec de validation de la zone de sécurité (MRZ) : {champ}.")

    if face["verifie"] is False:                          # visages différents
        return 100, "❌ REJETÉ", ["Visage non concordant. Selfie et pièce d'identité ne correspondent pas."]
    elif face["verifie"] is None:                         # visage non vérifiable
        risque += 10; details.append("Vérification faciale ignorée (Mode Dégradé).")

    # Décision — INCONNU ne peut JAMAIS être accepté automatiquement
    if type_piece == "INCONNU":
        details.append("Type de document non reconnu. Vérification manuelle requise.")
        decision = "⚠️ VÉRIFICATION MANUELLE" if risque <= 55 else "❌ REJETÉ"
    elif risque <= 25:
        decision = "✅ ACCEPTÉ"
    elif risque <= 55:
        decision = "⚠️ VÉRIFICATION MANUELLE"
    else:
        decision = "❌ REJETÉ"
    return risque, decision, details

# Décommente et adapte le chemin pour vérifier ce que PaddleOCR renvoie :
# img_test, _ = pretraiter("cni_recto_0002.jpg")          # prétraite une image
# zt = extraire_zones(img_test)                            # OCR via l'adaptateur
# print(f"{len(zt)} zones détectées :")
# for z in zt:                                             # affiche chaque zone
#     print(f"  x={z['xg']:4d} y={z['yh']:4d} conf={z['conf']:.2f}  «{z['texte']}»")


# --- Chargement paresseux du moteur OCR (pour l'API : ne bloque pas le démarrage du serveur) ---
extraire_zones = None                                     # sera la fonction OCR, créée au 1er appel

def _ensure_ocr():
    """Crée le moteur OCR au premier appel (lazy). Réutilisé ensuite."""
    global extraire_zones
    if extraire_zones is None:
        extraire_zones = creer_moteur_ocr(MOTEUR_OCR, gpu=UTILISER_GPU)
    return extraire_zones

def kyc_complet(chemin_recto, chemin_verso=None, chemin_selfie=None, type_force=None):
    """Chaîne KYC complète -> rapport structuré.
    type_force : 'CNI' | 'PASSEPORT' | 'CARTE_ELECTEUR' | 'PERMIS' — type déclaré par
                 l'utilisateur, prioritaire sur la détection automatique par OCR.
    """
    _ensure_ocr()                                         # charge l'OCR au 1er appel
    # 1) Prétraitement + OCR du recto
    recto, qualite = pretraiter(chemin_recto)             # image + netteté brute
    zones_recto = extraire_zones(recto)                   # OCR du recto (zones positionnées)

    # 2) MRZ du recto (passeport) — sinon on la cherchera au verso (CNI)
    mrz = lire_mrz(extraire_lignes_mrz(zones_recto))

    # 3) Identification du type — le type déclaré par l'utilisateur a PRIORITÉ sur l'OCR
    if type_force:
        type_piece = type_force
        scores = {type_force: 100}
    else:
        type_piece, scores = identifier_type(zones_recto, mrz["type"] if mrz else None)

    # 3 bis) GATE QUALITÉ pour la Carte d'Électeur (pas de MRZ = qualité = seule garantie)
    if type_piece == "CARTE_ELECTEUR" and qualite < SEUIL_NETTETE_ELECTEUR:
        return {"type_piece": type_piece, "qualite": round(qualite,1), "mrz": None,
                "champs": {}, "face": {"verifie": None, "erreur": "Non évalué (photo à reprendre)"},
                "risque": None, "decision": "🔄 REPRENDRE_PHOTO", "cle": None,
                "details": [f"Netteté {round(qualite,1)} < seuil {SEUIL_NETTETE_ELECTEUR} — image trop floue"],
                "image_recto": recto}

    # 4) Verso — SAUF Carte d'Électeur (pas de verso)
    zones_verso = []
    if type_piece != "CARTE_ELECTEUR" and chemin_verso:
        verso, _ = pretraiter(chemin_verso)               # prétraitement du verso
        zones_verso = extraire_zones(verso)               # OCR du verso
        if not mrz:                                        # MRZ non trouvée au recto -> verso (CNI TD1)
            mrz = lire_mrz(extraire_lignes_mrz(zones_verso))

    # 5) Extraction des champs (MRZ + position + motifs)
    champs = extraire_champs(type_piece, zones_recto, zones_verso, mrz)

    # 5 bis) Carte d'Électeur : validation de cohérence + clé composite
    problemes_electeur = []; cle = None
    if type_piece == "CARTE_ELECTEUR":
        problemes_electeur = valider_electeur(champs)      # contrôles (identifiant, numéro, dates)
        cle = cle_composite_electeur(champs)               # clé unique = identifiant + numéro

    # 6) Vérification faciale
    if chemin_selfie:
        face = verifier_visage(recto, cv2.imread(chemin_selfie))
    else:
        face = {"verifie": None, "distance": None, "seuil": None, "erreur": "Aucun selfie"}

    # 6bis) Liveness / anti-spoofing (selfie ET pièce) — détecte les photos d'écran/imprimées
    from .antispoof import verifier_liveness
    liveness_selfie = {"vrai": None, "score": None, "erreur": "Aucun selfie"}
    if chemin_selfie:
        img_selfie = cv2.imread(chemin_selfie)
        # on cadre sur le visage détecté par InsightFace (plus fiable que l'image entière)
        bbox = None
        try:
            from .core import _get_insightface           # réutilise le moteur déjà chargé
            faces = _get_insightface().get(img_selfie)
            if faces:
                b = max(faces, key=lambda f:(f.bbox[2]-f.bbox[0])*(f.bbox[3]-f.bbox[1])).bbox
                bbox = (int(b[0]), int(b[1]), int(b[2]), int(b[3]))
        except Exception:
            pass
        liveness_selfie = verifier_liveness(img_selfie, bbox)
    liveness_piece = verifier_liveness(recto)             # la pièce : vraie carte ou photo d'écran ?

    # 7) Décision
    risque, decision, details = evaluer_risque(qualite, champs, type_piece, face,
                                               problemes_electeur, mrz_ok=(mrz is not None),
                                               mrz_checks=(mrz.get("checks") if mrz else None),
                                               liveness_selfie=liveness_selfie,
                                               liveness_piece=liveness_piece)

    return {"type_piece": type_piece, "qualite": round(qualite,1), "mrz": mrz,
            "champs": champs, "face": face, "risque": risque, "decision": decision,
            "cle": cle, "details": details, "image_recto": recto,
            "age": calculer_age(champs.get("date_naissance")),
            "liveness_selfie": liveness_selfie, "liveness_piece": liveness_piece}