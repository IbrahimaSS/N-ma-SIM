import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // serialport charge un binaire natif (.node) via des chemins relatifs à son propre
  // dossier — le bundling par défaut casse cette résolution, donc on l'exclut.
  serverExternalPackages: ["serialport", "@serialport/bindings-cpp"],
};

export default nextConfig;
