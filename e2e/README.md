# E2E Tests con Playwright

Este directorio contiene los tests end-to-end (E2E) de la aplicación Sinergia usando Playwright.

## 📋 Tests Disponibles

- **auth.spec.ts** - Tests de autenticación y redirección
- **cliente.spec.ts** - Tests de gestión de clientes
- **propuesta.spec.ts** - Tests de creación y gestión de propuestas técnicas
- **pdf.spec.ts** - Tests de generación de PDFs

## 🚀 Ejecutar Tests

```bash
# Ejecutar todos los tests E2E
npm run test:e2e

# Ejecutar tests en modo UI (interactivo)
npm run test:e2e:ui

# Ejecutar un archivo específico
npx playwright test e2e/auth.spec.ts

# Ver reporte HTML
npm run test:e2e:report
```

## ⚠️ Importante: Configuración de Autenticación

Los tests de `cliente.spec.ts`, `propuesta.spec.ts` y `pdf.spec.ts` **requieren autenticación** para ejecutarse.

Actualmente estos tests están marcados con `test.skip()` porque requieren configuración adicional.

### Opciones para habilitar tests autenticados:

#### Opción 1: Autenticación Manual (Desarrollo)

1. Inicia la aplicación: `npm run dev`
2. Inicia sesión manualmente en http://localhost:3000
3. Ejecuta los tests en modo UI: `npm run test:e2e:ui`
4. Mantén la sesión activa durante la ejecución

#### Opción 2: Storage State (Recomendado para CI/CD)

1. Crea un archivo `e2e/auth.setup.ts`:

```typescript
import { test as setup } from '@playwright/test';

const authFile = '.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Navegar a la página de login
  await page.goto('/sign-in');

  // Completar el flujo de autenticación de Clerk
  // NOTA: Necesitas credenciales de prueba configuradas en Clerk
  await page.fill('input[name="identifier"]', process.env.TEST_USER_EMAIL!);
  await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD!);
  await page.click('button[type="submit"]');

  // Esperar a que termine la autenticación
  await page.waitForURL('/dashboard');

  // Guardar el estado de autenticación
  await page.context().storageState({ path: authFile });
});
```

2. Actualiza `playwright.config.ts`:

```typescript
export default defineConfig({
  // ... otras configuraciones
  projects: [
    // Setup project
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    // Chromium con autenticación
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
```

3. Crea variables de entorno para las credenciales de prueba:
```env
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=test-password-123
```

4. Remueve el `test.skip()` de los archivos de test

#### Opción 3: @clerk/testing (Recomendado para Clerk)

Clerk ofrece el paquete `@clerk/testing` para simplificar la autenticación en tests:

```bash
npm install -D @clerk/testing
```

Ver documentación: https://clerk.com/docs/testing/playwright

## 📝 Estructura de Tests

Cada archivo de test sigue este patrón:

1. **Describe block** - Agrupa tests relacionados
2. **beforeEach** - Setup común antes de cada test
3. **Tests individuales** - Casos de prueba específicos
4. **Assertions** - Verificaciones con `expect()`

## 🔍 Debugging

### Ver tests en modo UI
```bash
npm run test:e2e:ui
```

### Ejecutar con headed mode (ver el navegador)
```bash
npx playwright test --headed
```

### Ejecutar con debug mode
```bash
npx playwright test --debug
```

### Ver trace de un test fallido
```bash
npx playwright show-trace trace.zip
```

## 📊 Reportes

Después de ejecutar los tests, puedes ver el reporte HTML:

```bash
npm run test:e2e:report
```

Los reportes incluyen:
- Screenshots de tests fallidos
- Traces de navegación
- Logs de consola
- Requests de red

## 🎯 Mejores Prácticas

1. **Selectores estables**: Usa data-testid, roles ARIA, o texto visible
2. **Esperas explícitas**: Usa `waitForSelector()` en lugar de `waitForTimeout()`
3. **Cleanup**: Limpia datos de prueba creados durante los tests
4. **Datos únicos**: Usa timestamps para evitar conflictos con datos existentes
5. **Tests independientes**: Cada test debe poder ejecutarse de forma aislada

## 🚧 TODO

- [ ] Configurar autenticación automática con Clerk
- [ ] Agregar tests para casos de error
- [ ] Implementar cleanup automático de datos de prueba
- [ ] Agregar tests de performance (Lighthouse)
- [ ] Configurar CI/CD pipeline con Playwright
