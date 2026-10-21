# Pilote SK-AD3 : N'ma SIM

Pilote Python unique pour Windows 10/11, Linux et Raspberry Pi. Il pilote le distributeur Syncotek SK-AD3 par liaison série RS232.

| Fichier | Rôle |
|---|---|
| `skad3.py` | Pilote, utilisable comme bibliothèque ou en ligne de commande |
| `simulateur_skad3.py` | Faux distributeur pour développer sans le matériel |

## 1. Installation (identique partout)
```
pip install pyserial
```
Python 3.8 ou plus récent.

## 2. Branchement matériel : le point critique
- **Alimentation :** 24 V CC, 2,5 A minimum. Rouge = +24 V, noirs = GND, jaune = alimentation de secours (optionnelle).
- **Série :** le câble fourni se termine par une prise DB9 RS232, avec des niveaux de tension de ±12 V.
  - **PC Windows ou Linux :** utilisez un adaptateur USB vers RS232 (puce FTDI ou CH340, par exemple).
  - **Raspberry Pi : NE JAMAIS brancher le câble sur les broches GPIO (UART 3,3 V).** La tension RS232 détruirait le Pi. Deux solutions :
    - un adaptateur USB vers RS232 (recommandé, rien à configurer) ;
    - ou un module MAX3232 entre les broches GPIO 14/15 et le câble, en activant l'UART avec `raspi-config`.

## 3. Trouver le port
```
python skad3.py ports
```
| OS | Nom du port |
|---|---|
| Windows 10/11 | `COM3`, `COM4`… (visible dans le Gestionnaire de périphériques). Un pilote CH340 ou FTDI est parfois à installer |
| Linux / Raspberry Pi | `/dev/ttyUSB0` (USB-série) ou `/dev/serial0` (GPIO + MAX3232) |

Sous Linux et Raspberry Pi, donnez l'accès au port puis reconnectez-vous :
```
sudo usermod -aG dialout $USER
```

## 4. Premier test
```
python skad3.py --port COM3 probe      # trouve l'adresse du distributeur (0 à 15)
python skad3.py --port COM3 init       # obligatoire après chaque mise sous tension
python skad3.py --port COM3 status
python skad3.py --port COM3 info       # n° de série, version, configuration
python skad3.py --port COM3 iccid      # carte -> lecteur, lecture de l'ICCID de la SIM
python skad3.py --port COM3 front      # présente la carte au client (maintenue)
python skad3.py --port COM3 eject      # éjecte la carte sans la maintenir
python skad3.py --port COM3 capture    # envoie la carte au bac de rejet
python skad3.py --port COM3 dispense   # flux complet
python skad3.py --port COM3 -v status  # -v affiche les trames en hexadécimal
```
Si `probe` échoue, vérifiez dans l'ordre : l'alimentation 24 V, le port, le câble (TX et RX éventuellement inversés) et le sélecteur d'adresse (la démo AD3_TEST utilise 0#).

## 5. Intégration dans la borne
```python
from skad3 import SKAD3, SKAD3Error

def activer_chez_operateur(iccid: str) -> bool:
    # appel API opérateur (activation + KYC) -> True si OK
    return True

with SKAD3("COM3") as d:            # "/dev/ttyUSB0" sur Linux ou Raspberry Pi
    d.initialize()                  # une carte oubliée dans le canal part au bac de capture
    try:
        iccid = d.dispense_sim(activate=activer_chez_operateur)
        print("SIM remise :", iccid)
    except SKAD3Error as e:
        print("Incident distributeur :", e)   # ex. A0 empileur vide, 10 bourrage
```
Déroulé de `dispense_sim` :
1. Vérifie l'empileur.
2. Amène la carte au lecteur de puce.
3. Met la SIM sous tension et lit l'ICCID (commande GSM `A0`, puis commande UICC `00` si la première est refusée).
4. Appelle votre fonction d'activation.
5. Présente la carte au client si tout est OK. En cas d'erreur ou de refus, envoie la carte au bac de capture.

## 6. Développer sans le matériel
Linux, Raspberry Pi ou macOS :
```
python simulateur_skad3.py          # affiche par exemple /dev/pts/3
python skad3.py --port /dev/pts/3 dispense
```
Windows : installez com0com (paire de ports COM virtuels). Lancez ensuite `simulateur_skad3.py --port COM11` et `skad3.py --port COM10`.
Options du simulateur : `--cards N` (nombre de cartes dans l'empileur), `--fail-iccid` (simule une SIM illisible, pour tester le rejet).

## 7. Protocole : vérifié dans le SDK du fabricant
Le protocole a été contrôlé par désassemblage de `AD3_API.dll` :
- 8N1, BCC = XOR de STX à ETX ;
- échange : commande, puis ACK du distributeur (06), puis **ENQ (05) envoyé par l'hôte**, puis réponse. Aucun ACK final. La doc PDF du protocole omet l'ENQ ;
- codes d'erreur : A0 = empileur vide, A1 = bac de capture plein, B0 = initialisation requise.

La DLL du fabricant est **32 bits et Windows uniquement**. Le pilote Python ne l'utilise pas : il dialogue directement avec le distributeur par le port série, d'où son fonctionnement sur les quatre plateformes.

## 8. Points encore à valider sur le vrai matériel
- Les capteurs (`sensors`) : les deux docs se contredisent sur la valeur qui signifie « carte présente » ('0' ou '1'). À calibrer avec et sans carte.
- La tension acceptée par la SIM : `VCC_5V_ISO` par défaut, `VCC_3V_ISO` si l'activation échoue (erreurs 60 ou 61).
- Le réglage de la molette d'épaisseur pour les supports SIM des opérateurs.
