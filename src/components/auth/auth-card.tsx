import Image from "next/image";

/**
 * Marco compartido por las pantallas de autenticación. Reemplaza al layout que
 * traían los componentes hospedados de Clerk (`<SignIn />` / `<SignUp />`).
 */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-background p-8 shadow-sm">
        <div className="flex flex-col items-center gap-4 text-center">
          <Image
            src="/LogoHorizontal.webp"
            alt="Sinergia Ambiental"
            width={180}
            height={58}
            className="h-12 w-auto object-contain"
            priority
          />
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
        </div>

        {children}

        {footer ? <div className="text-center text-sm">{footer}</div> : null}
      </div>
    </div>
  );
}
