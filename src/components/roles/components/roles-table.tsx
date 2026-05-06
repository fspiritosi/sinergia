"use client";

import Link from "next/link";
import { Pencil, Lock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RoleWithPermissionsDto } from "@/dtos/role.dto";

type Props = {
  roles: RoleWithPermissionsDto[];
};

export function RolesTable({ roles }: Props) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rol</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-center">Permisos</TableHead>
            <TableHead className="text-center">Usuarios</TableHead>
            <TableHead className="w-[140px] text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{role.label}</span>
                  {role.isSystem ? (
                    <Badge variant="secondary" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Sistema
                    </Badge>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">{role.name}</p>
              </TableCell>
              <TableCell className="max-w-md text-sm text-muted-foreground">
                {role.description ?? "—"}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline">{role.permissions.length}</Badge>
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {role.usersCount ?? 0}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/dashboard/roles/${role.id}`}>
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    {role.isSystem ? "Ver" : "Editar"}
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {roles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                No hay roles.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
