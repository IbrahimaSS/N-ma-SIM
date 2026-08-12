# -*- coding: utf-8 -*-
"""
test_client.py — Vérifie que l'API KYC répond correctement.

Usage :
    1) Lancer l'API dans un terminal :   uvicorn app:app --port 8000
    2) Dans un autre terminal :          python test_client.py recto.jpg selfie.jpg [verso.jpg]

Ça envoie les images à l'API et affiche la réponse JSON.
"""
import sys
import json
import requests

API_URL = "http://localhost:8000/kyc"


def main():
    if len(sys.argv) < 3:
        print("Usage : python test_client.py <recto.jpg> <selfie.jpg> [verso.jpg]")
        sys.exit(1)

    recto = sys.argv[1]
    selfie = sys.argv[2]
    verso = sys.argv[3] if len(sys.argv) > 3 else None

    fichiers = {
        "recto": open(recto, "rb"),
        "selfie": open(selfie, "rb"),
    }
    if verso:
        fichiers["verso"] = open(verso, "rb")

    print(f"Envoi à {API_URL} ...")
    reponse = requests.post(API_URL, files=fichiers)

    print(f"\nStatut HTTP : {reponse.status_code}\n")
    if reponse.status_code == 200:
        data = reponse.json()
        print("===== RÉPONSE KYC =====")
        print(f"Décision  : {data.get('decision')}")
        print(f"Type      : {data.get('type_piece')}")
        print(f"Âge       : {data.get('age')}")
        print(f"Risque    : {data.get('risque')}")
        print(f"Clé unique: {data.get('cle')}")
        print("\nChamps extraits :")
        for k, v in (data.get("champs") or {}).items():
            print(f"   {k:16s}: {v}")
        print("\nJSON complet :")
        print(json.dumps(data, ensure_ascii=False, indent=2))
    else:
        print("Erreur :", reponse.text)


if __name__ == "__main__":
    main()
