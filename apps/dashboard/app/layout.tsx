import type { Metadata } from "next";
import "./globals.css";
import Shell from "./shell";

export const metadata: Metadata = {
  title: "Synketic | Internal dashboard",
  description:
    "Synketic Motion Systems internal dashboard development foundation.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
