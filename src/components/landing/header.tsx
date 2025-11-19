import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function Header() {
    return (
        <header className="sticky top-0 w-full z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href="/">
                        <Image
                            src="/LogoHorizontal.webp"
                            alt="Sinergia Logo"
                            width={150}
                            height={40}
                            className="h-16 w-auto object-contain"
                            priority
                        />
                    </Link>
                </div>

                <nav className="flex items-center gap-4">
                    <SignedOut>
                        <SignInButton mode="modal">
                            <Button variant="outline">
                                Iniciar Sesión
                            </Button>
                        </SignInButton>
                    </SignedOut>

                    <SignedIn>
                        <Link href="/dashboard">
                            <Button>
                                Ir al Dashboard
                            </Button>
                        </Link>
                    </SignedIn>
                </nav>
            </div>
        </header>
    );
}
