"""Sort une seule carte, sans lecture de puce ni activation operateur."""

import argparse
import sys

import serial

from skad3 import SKAD3, SKAD3Error, CommError, POS_FRONT_EJECT


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", default="COM1", help="Port serie (defaut : COM1)")
    parser.add_argument("--addr", type=int, choices=range(16), default=0)
    args = parser.parse_args()
    print(f"Connexion au distributeur sur {args.port}...", flush=True)
    try:
        with SKAD3(args.port, address=args.addr) as distributeur:
            # L'initialisation peut envoyer une carte deja dans le canal au bac de rejet.
            print("Initialisation (carte deja dans le canal : bac de rejet)...", flush=True)
            print("Firmware :", distributeur.initialize(), flush=True)
            if distributeur.status().stacker_empty:
                print("ERREUR : empileur vide. Rechargez les cartes.", file=sys.stderr)
                return 1
            print("Sortie d'une carte...", flush=True)
            distributeur.move(POS_FRONT_EJECT)
            print("Carte ejectee completement. SIM non activee.")
        return 0
    except serial.SerialException as error:
        print(f"ERREUR port {args.port} : {error}", file=sys.stderr)
        print("Fermez les applications utilisant ce port, y compris la borne si necessaire.", file=sys.stderr)
    except (SKAD3Error, CommError, RuntimeError) as error:
        print(f"ERREUR distributeur : {error}", file=sys.stderr)
        print("Verifiez alimentation, cable et adresse du distributeur.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
