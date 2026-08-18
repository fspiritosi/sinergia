"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Loader2, Monitor, Moon, Sun } from "lucide-react";
import { toast } from "sonner";

import { authClient, useSession } from "@/lib/auth-client";
import { avatarUrl, iniciales } from "@/lib/avatar";
import { compressImage } from "@/lib/compress-image";
import {
  AVATAR_MAX_LADO,
  AVATAR_TIPOS_PERMITIDOS,
  cambiarPasswordSchema,
  perfilSchema,
  validarArchivoAvatar,
  type CambiarPasswordInput,
  type PerfilInput,
} from "@/lib/validations/cuenta.schema";
import { updateAvatarAction, updateProfileAction } from "./account-actions";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserPreferencesStore, type Theme } from "@/stores/user-preferences.store";

interface MiCuentaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MiCuentaDialog({ open, onOpenChange }: MiCuentaDialogProps) {
  const { data, refetch } = useSession();
  const user = data?.user;

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Mi cuenta</DialogTitle>
          <DialogDescription>
            Tus datos personales, tu contraseña y cómo se ve la aplicación.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="perfil">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="password">Contraseña</TabsTrigger>
            <TabsTrigger value="apariencia">Apariencia</TabsTrigger>
          </TabsList>

          <TabsContent value="perfil" className="pt-4">
            <PestanaPerfil
              user={{
                id: user.id,
                name: user.name ?? null,
                email: user.email,
                image: (user.image as string | null) ?? null,
              }}
              onGuardado={() => refetch()}
            />
          </TabsContent>

          <TabsContent value="password" className="pt-4">
            <PestanaPassword onCambiada={() => onOpenChange(false)} />
          </TabsContent>

          <TabsContent value="apariencia" className="pt-4">
            <PestanaApariencia />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

type UsuarioSesion = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

function PestanaPerfil({ user, onGuardado }: { user: UsuarioSesion; onGuardado: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [imageKey, setImageKey] = useState(user.image);

  const form = useForm<PerfilInput>({
    resolver: zodResolver(perfilSchema),
    defaultValues: { name: user.name ?? "" },
  });

  // La sesión puede llegar después del primer render: sin esto el campo se
  // quedaría vacío aunque el usuario tenga nombre.
  useEffect(() => {
    form.reset({ name: user.name ?? "" });
    setImageKey(user.image);
  }, [user.name, user.image, form]);

  const elegirFoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Se limpia el input siempre: si no, elegir el mismo archivo dos veces
    // seguidas no dispara el change y parece que el botón no anda.
    event.target.value = "";
    if (!file) return;

    const problema = validarArchivoAvatar({ type: file.type, size: file.size });
    if (problema) {
      toast.error(problema);
      return;
    }

    setSubiendo(true);
    try {
      const comprimida = await compressImage(file, {
        maxWidthOrHeight: AVATAR_MAX_LADO,
        maxSizeMB: 0.3,
      });

      const formData = new FormData();
      formData.append("file", comprimida);

      const { imageKey: nueva } = await updateAvatarAction(formData);
      setImageKey(nueva);
      onGuardado();
      toast.success("Foto actualizada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo subir la foto");
    } finally {
      setSubiendo(false);
    }
  };

  const guardarNombre = async (valores: PerfilInput) => {
    try {
      await updateProfileAction(valores);
      onGuardado();
      toast.success("Perfil actualizado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el perfil");
    }
  };

  const url = avatarUrl(user.id, imageKey);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          {url ? <AvatarImage src={url} alt="" /> : null}
          <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
            {iniciales(user.name, user.email)}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={subiendo}
            onClick={() => inputRef.current?.click()}
          >
            {subiendo ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Camera className="mr-2 h-4 w-4" />
            )}
            {subiendo ? "Subiendo…" : "Cambiar foto"}
          </Button>
          <p className="text-xs text-muted-foreground">JPG, PNG o WEBP · máximo 5 MB</p>
          <input
            ref={inputRef}
            type="file"
            accept={AVATAR_TIPOS_PERMITIDOS.join(",")}
            className="hidden"
            onChange={elegirFoto}
            data-testid="input-avatar"
          />
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(guardarNombre)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre y apellido" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <Label className="text-muted-foreground">Email</Label>
            <Input value={user.email} readOnly disabled />
            <p className="text-xs text-muted-foreground">
              El email no se puede cambiar desde acá. Pedíselo a un administrador.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || !form.formState.isDirty}
              className="bg-sinergia text-white hover:bg-sinergia-hover"
            >
              {form.formState.isSubmitting ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </div>
  );
}

function PestanaPassword({ onCambiada }: { onCambiada: () => void }) {
  const form = useForm<CambiarPasswordInput>({
    resolver: zodResolver(cambiarPasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const cambiar = async (valores: CambiarPasswordInput) => {
    const { error } = await authClient.changePassword({
      currentPassword: valores.currentPassword,
      newPassword: valores.newPassword,
      // Si cambia la contraseña porque sospecha que se la vieron, dejar vivas
      // las otras sesiones anularía el cambio.
      revokeOtherSessions: true,
    });

    if (error) {
      // El caso corriente es que se haya equivocado en la actual; el mensaje de
      // better-auth viene en inglés, así que se traduce el que importa.
      const mensaje =
        error.code === "INVALID_PASSWORD"
          ? "La contraseña actual no es correcta"
          : (error.message ?? "No se pudo cambiar la contraseña");
      form.setError("currentPassword", { message: mensaje });
      return;
    }

    form.reset();
    toast.success("Contraseña actualizada. Se cerraron las demás sesiones.");
    onCambiada();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(cambiar)} className="space-y-4">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña actual</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña nueva</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormDescription>Al menos 8 caracteres.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Repetir contraseña nueva</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="bg-sinergia text-white hover:bg-sinergia-hover"
          >
            {form.formState.isSubmitting ? "Cambiando…" : "Cambiar contraseña"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

const TEMAS: Array<{ valor: Theme; etiqueta: string; icono: typeof Sun; ayuda: string }> = [
  { valor: "light", etiqueta: "Claro", icono: Sun, ayuda: "Siempre en claro" },
  { valor: "dark", etiqueta: "Oscuro", icono: Moon, ayuda: "Siempre en oscuro" },
  {
    valor: "system",
    etiqueta: "Sistema",
    icono: Monitor,
    ayuda: "Sigue la configuración del equipo",
  },
];

function PestanaApariencia() {
  const theme = useUserPreferencesStore((state) => state.theme);
  const setTheme = useUserPreferencesStore((state) => state.setTheme);

  return (
    <div className="space-y-3">
      <Label>Tema</Label>
      <RadioGroup
        value={theme}
        onValueChange={(valor) => setTheme(valor as Theme)}
        className="gap-2"
      >
        {TEMAS.map(({ valor, etiqueta, icono: Icono, ayuda }) => (
          <Label
            key={valor}
            htmlFor={`tema-${valor}`}
            className="flex cursor-pointer items-center gap-3 rounded-md border p-3 has-[:checked]:border-sinergia"
          >
            <RadioGroupItem value={valor} id={`tema-${valor}`} />
            <Icono className="h-4 w-4 text-muted-foreground" />
            <span className="flex flex-col">
              <span className="text-sm font-medium">{etiqueta}</span>
              <span className="text-xs font-normal text-muted-foreground">{ayuda}</span>
            </span>
          </Label>
        ))}
      </RadioGroup>

      <p className="text-xs text-muted-foreground">La preferencia se guarda en este dispositivo.</p>
    </div>
  );
}
