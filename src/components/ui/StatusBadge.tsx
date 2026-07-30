import { RequestStatus, PaymentStatus } from "@/types";
import { Badge } from "./Badge";

interface StatusBadgeProps {
  status: RequestStatus | PaymentStatus;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  let variant: "default" | "success" | "warning" | "error" = "default";
  const label = status.replace(/_/g, " ");

  // Mapping des statuts vers les couleurs
  switch (status) {
    case "VALIDEE":
    case "TERMINEE":
    case "CONFIRME":
    case "SELFIE_VALIDE":
      variant = "success";
      break;
    case "EN_COURS":
    case "DOCUMENT_ANALYSE":
    case "INFOS_A_CONFIRMER":
    case "CONTROLE_LIGNE_EN_COURS":
    case "PAIEMENT_EN_ATTENTE":
    case "EN_ATTENTE":
    case "EN_ATTENTE_VALIDATION":
      variant = "warning";
      break;
    case "REJETEE":
    case "ECHOUE":
      variant = "error";
      break;
    default:
      variant = "default";
  }

  const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();

  return (
    <Badge variant={variant} className={className}>
      {formattedLabel}
    </Badge>
  );
};
