"""Evite de lancer une seconde API sur le meme port."""

import json
import socket
import sys
from urllib.request import urlopen

from api_scanner import HOST, PORT, app
import uvicorn


def main():
    with socket.socket() as sock:
        try:
            sock.bind((HOST, PORT))
        except OSError:
            try:
                with urlopen(f"http://{HOST}:{PORT}/status", timeout=3) as response:
                    status = json.load(response)
                if status.get("status") == "ok" and status.get("message") == "API Scanner opérationnelle":
                    print(f"L'API Scanner fonctionne deja : http://{HOST}:{PORT}")
                    print("Aucun second serveur n'a ete lance.")
                    return 0
            except Exception:
                pass
            print(f"Le port {PORT} est utilise par un autre service. Fermez-le avant de relancer.", file=sys.stderr)
            return 1
    print(f"API Scanner : http://{HOST}:{PORT}", flush=True)
    uvicorn.run(app, host=HOST, port=PORT)
    return 0


if __name__ == "__main__":
    sys.exit(main())
