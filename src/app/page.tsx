import { Header } from "@/components/landing/header";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero Section Skeleton */}
      <section className="py-20 lg:py-32 border-b border-border">
        <div className="container mx-auto px-4 flex flex-col items-center text-center gap-8">
          {/* Title Placeholder */}
          <div className="h-12 w-3/4 md:w-1/2 bg-muted border border-border rounded-lg" />
          <div className="h-12 w-2/3 md:w-1/3 bg-muted border border-border rounded-lg" />

          {/* Description Placeholder */}
          <div className="space-y-3 w-full max-w-2xl mt-4">
            <div className="h-4 w-full bg-muted border border-border rounded" />
            <div className="h-4 w-5/6 mx-auto bg-muted border border-border rounded" />
            <div className="h-4 w-4/6 mx-auto bg-muted border border-border rounded" />
          </div>

          {/* Buttons Placeholder */}
          <div className="flex gap-4 mt-8">
            <div className="h-10 w-32 bg-muted border border-border rounded-md" />
            <div className="h-10 w-32 bg-muted border border-border rounded-md" />
          </div>
        </div>
      </section>

      {/* Features Grid Skeleton */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 border border-border rounded-xl space-y-4">
                <div className="h-12 w-12 bg-muted border border-border rounded-lg" />
                <div className="h-6 w-1/2 bg-muted border border-border rounded" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted border border-border rounded" />
                  <div className="h-4 w-5/6 bg-muted border border-border rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
