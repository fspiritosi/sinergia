import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sinergia Ambiental",
  description: "Sinergia Ambiental",
  icons: {
    icon: "/LogoVertical.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // better-auth no necesita un provider en el árbol: el estado de sesión lo
  // resuelve `useSession()` del auth-client donde haga falta.
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable}  font-sans`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
