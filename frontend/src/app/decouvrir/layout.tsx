import { Lora } from "next/font/google";

const lora = Lora({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-headline" });

export default function DecouvrirLayout({ children }: { children: React.ReactNode }) {
  return <div className={lora.variable}>{children}</div>;
}
