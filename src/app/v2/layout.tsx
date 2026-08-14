import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lift IQ — Train smarter. Get stronger.",
  description: "Intelligent strength training built around your performance.",
};

/** Theme root. Every Lift IQ screen renders inside the scoped `.liq` design system. */
export default function LiftIQThemeLayout({ children }: { children: React.ReactNode }) {
  return <div className="liq min-h-[100dvh] antialiased">{children}</div>;
}
