"""borne.py – Interface borne pour scanner de pièces d'identité.

Écran tactile / kiosk :
  1. L'utilisateur pose sa carte sur la vitre du scanner
  2. Il appuie sur « Scanner » à l'écran
  3. Le scan se lance, l'écran affiche « Analyse en cours... »
  4. Le résultat s'affiche avec le cadre bleu (style Files by Google)
  5. La carte découpée est montrée, puis envoyée au serveur OCR

Usage :
    python borne.py
"""

import os
import threading
import tkinter as tk
from tkinter import font as tkfont
from PIL import Image, ImageTk, ImageDraw
import cv2
import numpy as np

from scanner import scanner, decouper, envoyer


# ---------- RÉGLAGES BORNE ----------
PLEIN_ECRAN = True        # True = mode kiosk (plein écran), False = fenêtré
FOND = "#1a1a2e"          # couleur de fond
ACCENT = "#0f87ff"        # bleu accent (cadre détection)
VERT = "#00d97e"          # vert validation
TEXTE = "#ffffff"         # couleur texte
GRIS = "#8892a4"          # texte secondaire
BOUTON_BG = "#0f87ff"     # fond bouton
BOUTON_FG = "#ffffff"     # texte bouton
# ------------------------------------


class BorneApp:
    """Application borne de scan de pièces d'identité."""

    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Scanner de pièces d'identité")
        self.root.configure(bg=FOND)

        if PLEIN_ECRAN:
            self.root.attributes("-fullscreen", True)
            self.root.bind("<Escape>", lambda e: self.root.attributes("-fullscreen", False))
        else:
            self.root.geometry("1024x768")

        # Polices
        self.font_titre = tkfont.Font(family="Segoe UI", size=32, weight="bold")
        self.font_sous_titre = tkfont.Font(family="Segoe UI", size=18)
        self.font_bouton = tkfont.Font(family="Segoe UI", size=20, weight="bold")
        self.font_info = tkfont.Font(family="Segoe UI", size=14)
        self.font_petit = tkfont.Font(family="Segoe UI", size=12)

        # État
        self.face_courante = "recto"     # "recto" ou "verso"
        self.type_carte = tk.StringVar(value="identite") # "identite" ou "electeur"
        self.carte_recto = None          # image découpée du recto
        self.carte_verso = None          # image découpée du verso
        self.scan_brut = None            # scan pleine vitre (pour affichage)
        self.quad_detecte = None         # coins détectés (pour cadre bleu)

        # Conteneur principal
        self.container = tk.Frame(self.root, bg=FOND)
        self.container.pack(fill=tk.BOTH, expand=True)

        self._afficher_accueil()

    # ===================================================================
    #  ÉCRAN 1 : ACCUEIL – « Posez votre carte »
    # ===================================================================

    def _vider(self):
        """Vide le conteneur principal."""
        for w in self.container.winfo_children():
            w.destroy()

    def _afficher_accueil(self):
        """Écran d'accueil : instructions + bouton Scanner."""
        self._vider()
        self.face_courante = "recto"

        # Espacement haut
        tk.Frame(self.container, bg=FOND, height=60).pack()

        # Icône scanner (emoji)
        tk.Label(self.container, text="🪪", font=("Segoe UI Emoji", 80),
                 bg=FOND, fg=TEXTE).pack(pady=(0, 10))

        # Titre
        tk.Label(self.container,
                 text="Scanner de pièce d'identité",
                 font=self.font_titre, bg=FOND, fg=TEXTE).pack(pady=(0, 20))

        # Instructions
        tk.Label(self.container,
                 text="Posez le RECTO de votre carte sur la vitre du scanner\n"
                      "puis appuyez sur le bouton ci-dessous",
                 font=self.font_sous_titre, bg=FOND, fg=GRIS,
                 justify=tk.CENTER).pack(pady=(0, 40))

        # Choix du type de carte
        frame_choix = tk.Frame(self.container, bg=FOND)
        frame_choix.pack(pady=10)
        
        tk.Radiobutton(frame_choix, text="Carte d'Identité (NIN)", variable=self.type_carte,
                       value="identite", font=self.font_info, bg=FOND, fg=TEXTE,
                       selectcolor="#444", cursor="hand2").pack(side=tk.LEFT, padx=20)

        tk.Radiobutton(frame_choix, text="Carte d'Électeur", variable=self.type_carte,
                       value="electeur", font=self.font_info, bg=FOND, fg=TEXTE,
                       selectcolor="#444", cursor="hand2").pack(side=tk.LEFT, padx=20)

        tk.Radiobutton(frame_choix, text="Passeport", variable=self.type_carte,
                       value="passeport", font=self.font_info, bg=FOND, fg=TEXTE,
                       selectcolor="#444", cursor="hand2").pack(side=tk.LEFT, padx=20)

        tk.Radiobutton(frame_choix, text="Permis Biométrique", variable=self.type_carte,
                       value="permis", font=self.font_info, bg=FOND, fg=TEXTE,
                       selectcolor="#444", cursor="hand2").pack(side=tk.LEFT, padx=20)

        # Bouton Scanner
        btn = tk.Button(self.container,
                        text="📷  Scanner le RECTO",
                        font=self.font_bouton,
                        bg=BOUTON_BG, fg=BOUTON_FG,
                        activebackground="#0d6efd", activeforeground=BOUTON_FG,
                        relief=tk.FLAT, padx=50, pady=20,
                        cursor="hand2",
                        command=lambda: self._lancer_scan("recto"))
        btn.pack(pady=20)

        # Aide en bas
        tk.Label(self.container,
                 text="Appuyez sur Échap pour quitter le mode plein écran",
                 font=self.font_petit, bg=FOND, fg="#555").pack(side=tk.BOTTOM, pady=20)

    # ===================================================================
    #  ÉCRAN 2 : ANALYSE EN COURS
    # ===================================================================

    def _afficher_analyse(self, face):
        """Écran « Analyse en cours... Veuillez patienter »."""
        self._vider()

        tk.Frame(self.container, bg=FOND, height=120).pack()

        # Spinner (texte animé)
        tk.Label(self.container, text="⏳", font=("Segoe UI Emoji", 60),
                 bg=FOND, fg=TEXTE).pack(pady=(0, 20))

        self.label_analyse = tk.Label(self.container,
                                      text="Analyse en cours...\nVeuillez patienter",
                                      font=self.font_titre, bg=FOND, fg=TEXTE,
                                      justify=tk.CENTER)
        self.label_analyse.pack(pady=(0, 20))

        tk.Label(self.container,
                 text=f"Scan du {face.upper()}",
                 font=self.font_sous_titre, bg=FOND, fg=GRIS).pack()

        # Animer les points
        self._animer_points(0)

    def _animer_points(self, n):
        """Anime les points de suspension pendant l'analyse."""
        if not hasattr(self, 'label_analyse') or not self.label_analyse.winfo_exists():
            return
        points = "." * (n % 4)
        self.label_analyse.config(text=f"Analyse en cours{points}\nVeuillez patienter")
        self.root.after(500, self._animer_points, n + 1)

    # ===================================================================
    #  ÉCRAN 3 : RÉSULTAT – Affichage style Files by Google
    # ===================================================================

    def _afficher_resultat(self, face, scan_brut, carte):
        """Affiche le résultat : scan brut avec cadre bleu + carte découpée."""
        self._vider()

        # Titre
        tk.Label(self.container,
                 text=f"✅  {face.upper()} scanné avec succès",
                 font=self.font_titre, bg=FOND, fg=VERT).pack(pady=(30, 20))

        # Zone d'images côte à côte
        frame_images = tk.Frame(self.container, bg=FOND)
        frame_images.pack(fill=tk.BOTH, expand=True, padx=40)

        # Colonne gauche : scan brut avec cadre bleu
        col_gauche = tk.Frame(frame_images, bg=FOND)
        col_gauche.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10)

        tk.Label(col_gauche, text="Scan original",
                 font=self.font_info, bg=FOND, fg=GRIS).pack(pady=(0, 5))

        img_brut = self._preparer_apercu_brut(scan_brut, carte)
        if img_brut:
            label_brut = tk.Label(col_gauche, image=img_brut, bg=FOND)
            label_brut.image = img_brut  # garder la référence
            label_brut.pack()

        # Colonne droite : carte découpée
        col_droite = tk.Frame(frame_images, bg=FOND)
        col_droite.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=10)

        tk.Label(col_droite, text="Carte extraite",
                 font=self.font_info, bg=FOND, fg=GRIS).pack(pady=(0, 5))

        img_carte = self._cv2_to_tk(carte, max_h=350)
        if img_carte:
            label_carte = tk.Label(col_droite, image=img_carte, bg=FOND,
                                   relief=tk.SOLID, bd=3)
            label_carte.image = img_carte
            label_carte.pack()

        # Boutons
        frame_boutons = tk.Frame(self.container, bg=FOND)
        frame_boutons.pack(pady=30)

        if face == "recto":
            # Bouton : passer au verso
            tk.Button(frame_boutons,
                      text="✅  Valider et scanner le VERSO",
                      font=self.font_bouton,
                      bg=VERT, fg=BOUTON_FG,
                      activebackground="#00b368",
                      relief=tk.FLAT, padx=40, pady=15,
                      cursor="hand2",
                      command=self._passer_au_verso).pack(side=tk.LEFT, padx=10)
        else:
            # Bouton : terminer
            tk.Button(frame_boutons,
                      text="✅  Terminer",
                      font=self.font_bouton,
                      bg=VERT, fg=BOUTON_FG,
                      activebackground="#00b368",
                      relief=tk.FLAT, padx=40, pady=15,
                      cursor="hand2",
                      command=self._terminer).pack(side=tk.LEFT, padx=10)

        # Bouton : rescanner
        tk.Button(frame_boutons,
                  text="🔄  Rescanner",
                  font=self.font_bouton,
                  bg="#ff6b35", fg=BOUTON_FG,
                  activebackground="#e55a2b",
                  relief=tk.FLAT, padx=40, pady=15,
                  cursor="hand2",
                  command=lambda: self._lancer_scan(face)).pack(side=tk.LEFT, padx=10)

    # ===================================================================
    #  ÉCRAN 4 : ERREUR – carte non détectée
    # ===================================================================

    def _afficher_erreur(self, face):
        """Écran d'erreur : carte non détectée."""
        self._vider()

        tk.Frame(self.container, bg=FOND, height=100).pack()

        tk.Label(self.container, text="❌", font=("Segoe UI Emoji", 60),
                 bg=FOND).pack(pady=(0, 20))

        tk.Label(self.container,
                 text="Carte non détectée",
                 font=self.font_titre, bg=FOND, fg="#ff4444").pack(pady=(0, 15))

        tk.Label(self.container,
                 text="Vérifiez que la carte est bien posée sur la vitre\n"
                      "et que le capot est fermé, puis réessayez.",
                 font=self.font_sous_titre, bg=FOND, fg=GRIS,
                 justify=tk.CENTER).pack(pady=(0, 40))

        tk.Button(self.container,
                  text="🔄  Réessayer",
                  font=self.font_bouton,
                  bg=BOUTON_BG, fg=BOUTON_FG,
                  relief=tk.FLAT, padx=50, pady=20,
                  cursor="hand2",
                  command=lambda: self._lancer_scan(face)).pack()

    # ===================================================================
    #  ÉCRAN 5 : VERSO – « Posez le verso »
    # ===================================================================

    def _passer_au_verso(self):
        """Écran : retournez la carte pour le verso."""
        self._vider()

        tk.Frame(self.container, bg=FOND, height=80).pack()

        tk.Label(self.container, text="🔄", font=("Segoe UI Emoji", 60),
                 bg=FOND).pack(pady=(0, 20))

        tk.Label(self.container,
                 text="Retournez la carte",
                 font=self.font_titre, bg=FOND, fg=TEXTE).pack(pady=(0, 15))

        tk.Label(self.container,
                 text="Posez le VERSO de votre carte sur la vitre\n"
                      "puis appuyez sur Scanner",
                 font=self.font_sous_titre, bg=FOND, fg=GRIS,
                 justify=tk.CENTER).pack(pady=(0, 40))

        tk.Button(self.container,
                  text="📷  Scanner le VERSO",
                  font=self.font_bouton,
                  bg=BOUTON_BG, fg=BOUTON_FG,
                  relief=tk.FLAT, padx=50, pady=20,
                  cursor="hand2",
                  command=lambda: self._lancer_scan("verso")).pack()

    # ===================================================================
    #  ÉCRAN 6 : TERMINÉ
    # ===================================================================

    def _terminer(self):
        """Écran final : tout est scanné."""
        self._vider()

        tk.Frame(self.container, bg=FOND, height=80).pack()

        tk.Label(self.container, text="✅", font=("Segoe UI Emoji", 80),
                 bg=FOND).pack(pady=(0, 20))

        tk.Label(self.container,
                 text="Scan terminé !",
                 font=self.font_titre, bg=FOND, fg=VERT).pack(pady=(0, 15))

        tk.Label(self.container,
                 text="Recto et verso enregistrés avec succès.\n"
                      "Vous pouvez retirer votre carte.",
                 font=self.font_sous_titre, bg=FOND, fg=GRIS,
                 justify=tk.CENTER).pack(pady=(0, 40))

        tk.Button(self.container,
                  text="🔁  Nouveau scan",
                  font=self.font_bouton,
                  bg=BOUTON_BG, fg=BOUTON_FG,
                  relief=tk.FLAT, padx=50, pady=20,
                  cursor="hand2",
                  command=self._afficher_accueil).pack()

    # ===================================================================
    #  LOGIQUE DE SCAN
    # ===================================================================

    def _lancer_scan(self, face):
        """Lance le scan dans un thread séparé (ne bloque pas l'interface)."""
        self.face_courante = face
        self._afficher_analyse(face)
        # Le scan WIA est bloquant → thread séparé
        thread = threading.Thread(target=self._scan_thread, args=(face,),
                                  daemon=True)
        thread.start()

    def _scan_thread(self, face):
        """Thread de scan : scanner → découper → afficher résultat."""
        try:
            img = scanner()
        except Exception as e:
            err_str = str(e)
            self.root.after(0, lambda msg=err_str: self._afficher_erreur_msg(
                f"Scanner indisponible : {msg}"))
            return

        self.scan_brut = img
        carte = decouper(img, type_carte=self.type_carte.get())

        if carte is None:
            self.root.after(0, lambda: self._afficher_erreur(face))
            return

        # Stocker la carte
        if face == "recto":
            self.carte_recto = carte
        else:
            self.carte_verso = carte

        # Afficher le résultat dans le thread principal
        self.root.after(0, lambda: self._afficher_resultat(face, img, carte))

    def _afficher_erreur_msg(self, msg):
        """Affiche un message d'erreur personnalisé."""
        self._vider()
        tk.Frame(self.container, bg=FOND, height=100).pack()
        tk.Label(self.container, text="⚠️", font=("Segoe UI Emoji", 60),
                 bg=FOND).pack(pady=(0, 20))
        tk.Label(self.container, text="Erreur",
                 font=self.font_titre, bg=FOND, fg="#ff4444").pack(pady=(0, 15))
        tk.Label(self.container, text=msg,
                 font=self.font_sous_titre, bg=FOND, fg=GRIS,
                 wraplength=700, justify=tk.CENTER).pack(pady=(0, 40))
        tk.Button(self.container, text="🔄  Réessayer",
                  font=self.font_bouton, bg=BOUTON_BG, fg=BOUTON_FG,
                  relief=tk.FLAT, padx=50, pady=20, cursor="hand2",
                  command=self._afficher_accueil).pack()

    # ===================================================================
    #  UTILITAIRES D'IMAGE
    # ===================================================================

    def _cv2_to_tk(self, img_cv2, max_h=400, max_w=None):
        """Convertit une image OpenCV (BGR) en ImageTk pour affichage."""
        if img_cv2 is None:
            return None
        img_rgb = cv2.cvtColor(img_cv2, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(img_rgb)

        # Redimensionner pour l'écran
        w, h = pil_img.size
        if max_w is None:
            max_w = int(self.root.winfo_screenwidth() * 0.4)
        ratio = min(max_w / w, max_h / h, 1.0)
        if ratio < 1.0:
            pil_img = pil_img.resize((int(w * ratio), int(h * ratio)),
                                     Image.LANCZOS)
        return ImageTk.PhotoImage(pil_img)

    def _preparer_apercu_brut(self, scan_brut, carte_decoupee):
        """Prépare l'aperçu du scan brut avec le cadre bleu (style Files)."""
        if scan_brut is None:
            return None

        # Réduire pour affichage
        h, w = scan_brut.shape[:2]
        max_h = 350
        max_w = int(self.root.winfo_screenwidth() * 0.4)
        ratio = min(max_w / w, max_h / h, 1.0)
        small = cv2.resize(scan_brut, (int(w * ratio), int(h * ratio)),
                           interpolation=cv2.INTER_AREA)

        # Détecter le contour de la carte pour dessiner le cadre bleu
        from scanner import _reduire, _ordonner_quad
        # Refaire la détection sur le brut pour trouver le quad
        self._dessiner_cadre_bleu(small, scan_brut, ratio)

        img_rgb = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(img_rgb)
        return ImageTk.PhotoImage(pil_img)

    def _dessiner_cadre_bleu(self, small, original, ratio_affichage):
        """Dessine le cadre bleu autour de la carte détectée sur l'aperçu."""
        # Refaire une détection rapide pour trouver le rectangle
        gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        h_s, w_s = small.shape[:2]
        aire_img = float(h_s * w_s)

        bg_color = np.median(small.reshape(-1, 3), axis=0)
        diff = np.linalg.norm(small.astype(float) - bg_color.astype(float), axis=2)

        best_quad = None
        best_area = -1.0

        for seuil in [25, 30, 20, 15]:
            binary = (diff > seuil).astype(np.uint8) * 255
            k = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
            cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, k)
            cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, k)

            cnts, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL,
                                       cv2.CHAIN_APPROX_SIMPLE)
            for c in cnts:
                hull = cv2.convexHull(c)
                area = cv2.contourArea(hull)
                if area / aire_img < 0.02 or area / aire_img > 0.8:
                    continue
                rect = cv2.minAreaRect(hull)
                (cx, cy), (rw, rh), angle = rect
                if min(rw, rh) < 10:
                    continue
                ar = max(rw, rh) / min(rw, rh)
                if ar < 1.1 or ar > 2.3:
                    continue
                rect_area = rw * rh
                if rect_area > 0 and area / rect_area > 0.6 and area > best_area:
                    best_area = area
                    best_quad = cv2.boxPoints(rect).astype(np.int32)

            if best_quad is not None:
                break

        if best_quad is not None:
            # Dessiner le cadre bleu avec coins arrondis
            pts = best_quad.reshape((-1, 1, 2))
            # Fond semi-transparent (overlay)
            overlay = small.copy()
            cv2.fillPoly(overlay, [best_quad], (255, 180, 0, 50))
            cv2.addWeighted(overlay, 0.15, small, 0.85, 0, small)
            # Cadre bleu
            cv2.polylines(small, [pts], True, (255, 180, 0), 3)
            # Points aux coins
            for pt in best_quad:
                cv2.circle(small, tuple(pt), 6, (255, 180, 0), -1)

    def run(self):
        """Lance la boucle principale."""
        self.root.mainloop()


if __name__ == "__main__":
    app = BorneApp()
    app.run()
