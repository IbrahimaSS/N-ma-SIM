type Langue = string | null | undefined;

/**
 * Libellé du numéro principal selon le type de pièce.
 * Accepte le type du frontend ("passeport") comme celui de l'API ("PASSEPORT").
 */
export function libelleNumeroPiece(typePiece: string | null | undefined, lang: Langue): string {
  const en = lang === "en";
  switch ((typePiece ?? "").toLowerCase()) {
    case "passeport":
      return en ? "Passport number" : "Numéro de passeport";
    case "carte_electeur":
      return en ? "Card number" : "Numéro de carte";
    case "permis":
      return en ? "Licence number" : "Numéro de permis";
    default:
      return en ? "Document number" : "Numéro de pièce";
  }
}

export function libelleNumeroPersonnel(lang: Langue): string {
  return lang === "en" ? "Personal number" : "Numéro personnel";
}
