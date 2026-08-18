"use client";
export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import SelfieVue from "../../nouvelle-sim/selfie/page";

export default function ReactivationSelfie() {
  const router = useRouter();
  
  return (
    <div onClick={(e) => {
      const target = e.target as HTMLElement;
      if (target.innerText && (target.innerText.includes("Continuer") || target.innerText.includes("Continue"))) {
        e.stopPropagation();
        router.push("/borne/reactivation/verification");
      }
    }}>
       <SelfieVue />
    </div>
  );
}
