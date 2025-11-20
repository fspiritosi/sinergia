import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto } from "next/font/google";
import "./globals.css";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";




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
  return (
    <ClerkProvider localization={esES} >
      <html lang="es">
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable}  font-sans`}
        >

          {children}
        </body>
      </html>
    </ClerkProvider>


  );
}
