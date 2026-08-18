import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/providers/theme-provider";

/**
 * Aplica el tema antes de que React hidrate.
 *
 * La preferencia vive en localStorage (store de Zustand), que sólo se puede
 * leer en el cliente. Si esperáramos al `useEffect` del ThemeProvider, quien
 * eligió "oscuro" vería un destello blanco en cada carga. Este script corre
 * sincrónico, antes del primer pintado, y deja la clase puesta.
 */
const SCRIPT_TEMA = `
(function () {
  try {
    var guardado = localStorage.getItem("user-preferences");
    var tema = guardado ? JSON.parse(guardado).state.theme : "system";
    if (tema === "system") {
      tema = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.classList.add(tema);
  } catch (e) {}
})();
`;

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
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable}  font-sans`}
      >
        <ThemeProvider />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
