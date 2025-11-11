"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function PageHeader() {
    const pathname = usePathname()

    // Obtener el último segmento del path y capitalizarlo
    const getPageTitle = (path: string) => {
        const segments = path.split('/').filter(Boolean)
        const lastSegment = segments[segments.length - 1] || 'dashboard'

        // Casos especiales para nombres más amigables
        const specialCases: Record<string, string> = {
            'dashboard': 'Dashboard',   
            'clientes': 'Clientes',
            'solicitudes': 'Solicitudes',
            'inspecciones': 'Inspecciones',
            'calendario': 'Calendario',
            'reportes': 'Reportes',
            'configuracion': 'Configuración',
            'documentos': 'Documentos',
            'nueva': 'Nueva Solicitud',
        }

        // Si hay un caso especial, usarlo
        if (specialCases[lastSegment]) {
            return specialCases[lastSegment]
        }

        // Capitalizar la primera letra y reemplazar guiones con espacios
        return lastSegment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
    }

    const pageTitle = getPageTitle(pathname)


    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-white px-4 ">
            <SidebarTrigger className="-ml-1  hover:bg-primary-foreground/10" />
            
            <div className="flex items-center gap-3 flex-1">
                <h1 className="text-lg font-semibold ">{pageTitle}</h1>
            </div>
        </header>
    )
}