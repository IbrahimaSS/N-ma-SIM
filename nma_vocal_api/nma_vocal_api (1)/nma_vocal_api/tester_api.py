"""
Petit script pour tester l'API vocale une fois lancée.
Usage : python tester_api.py chemin/vers/audio.wav page_choix_du_service
"""
import sys, requests

if len(sys.argv) < 3:
    print("Usage : python tester_api.py <audio.wav> <page>")
    print("Pages : page_choix_du_service | page_type_de_piece | page_motif_reactivation")
    sys.exit(1)

fichier, page = sys.argv[1], sys.argv[2]
url = "http://localhost:8100/comprendre"

with open(fichier, "rb") as f:
    r = requests.post(url, data={"page": page}, files={"audio": f})

print("Réponse de l'API :")
print(r.json())
