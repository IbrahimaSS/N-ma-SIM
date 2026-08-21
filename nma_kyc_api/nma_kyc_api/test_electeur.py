from nma_kyc.core import extraire_electeur

zones = [
    {"texte": "REPUBLIQUE DE GUINEE", "rx": 0.1, "ry": 0.1},
    {"texte": "CARTE D'ELECTEUR", "rx": 0.2, "ry": 0.2},
    {"texte": "Identifiant:", "rx": 0.1, "ry": 0.3},
    {"texte": "12345ABC1234567890", "rx": 0.3, "ry": 0.3},
    {"texte": "Nom: SYLLA", "rx": 0.1, "ry": 0.4},
    {"texte": "Prénom(s): IBRAHIMA", "rx": 0.1, "ry": 0.5},
    {"texte": "Né(e) le: 01/01/1990 à CONAKRY", "rx": 0.1, "ry": 0.6},
    {"texte": "Sexe: M", "rx": 0.1, "ry": 0.7},
    {"texte": "Numéro de carte:", "rx": 0.1, "ry": 0.8},
    {"texte": "123456789", "rx": 0.3, "ry": 0.8},
]

print(extraire_electeur(zones))
