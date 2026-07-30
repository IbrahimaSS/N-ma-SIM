import { redirect } from "next/navigation";

export default function Home() {
  // Redirection automatique vers la borne pour notre démo
  redirect("/borne/accueil");
}
