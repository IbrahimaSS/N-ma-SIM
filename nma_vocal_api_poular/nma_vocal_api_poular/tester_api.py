"""Test de l'API vocale poular. Usage : python tester_api.py audio.wav page_type_de_piece"""
import sys, requests
if len(sys.argv)<3:
    print("Usage : python tester_api.py <audio.wav> <page>")
    print("Pages : page_choix_du_service | page_type_de_piece | page_motif_reactivation")
    sys.exit(1)
fichier,page=sys.argv[1],sys.argv[2]
with open(fichier,"rb") as f:
    r=requests.post("http://localhost:8200/comprendre",data={"page":page},files={"audio":f})
print(r.json())
