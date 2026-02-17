import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-[250px]" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}
