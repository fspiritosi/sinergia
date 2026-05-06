"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { getRoles } from "./components/actions";
import { RolesTable } from "./components/roles-table";

export function Roles() {
  const { data: roles, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return <RolesTable roles={roles ?? []} />;
}
