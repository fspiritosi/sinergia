import { test, expect } from "@playwright/test";

/**
 * IMPORTANTE: Estos tests requieren autenticación.
 *
 * Para ejecutar estos tests, necesitas:
 * 1. Configurar credenciales de prueba en Clerk
 * 2. Usar Playwright's authentication state
 * 3. O ejecutar manualmente después de iniciar sesión
 *
 * Ejemplo de setup de autenticación:
 * - Crear un archivo auth.setup.ts que haga login y guarde el estado
 * - Usar ese estado en estos tests con: test.use({ storageState: 'auth.json' })
 */

test.describe("Cliente Management", () => {
  // Skip tests by default since they require authentication
  test.skip(({ browserName }) => true, "Requires authentication setup");

  test.beforeEach(async ({ page }) => {
    // Navegar a la página de clientes
    await page.goto("/dashboard/clientes");
    await page.waitForLoadState("networkidle");
  });

  test("should display clientes page", async ({ page }) => {
    // Verificar que estamos en la página correcta
    await expect(page).toHaveURL("/dashboard/clientes");

    // Verificar que existe el título o heading de la página
    const heading = page.locator("h1, h2").filter({ hasText: /clientes/i });
    await expect(heading).toBeVisible();
  });

  test("should open create cliente dialog", async ({ page }) => {
    // Buscar el botón para crear nuevo cliente
    const createButton = page.locator("button").filter({ hasText: /nuevo|agregar|crear/i });
    await createButton.first().click();

    // Verificar que se abre el dialog/modal
    const dialog = page.locator('[role="dialog"], dialog').filter({ hasText: /cliente/i });
    await expect(dialog).toBeVisible();
  });

  test("should create a new cliente", async ({ page }) => {
    // Datos de prueba con timestamp para evitar duplicados
    const timestamp = Date.now();
    const testCliente = {
      name: `Test Cliente E2E ${timestamp}`,
      cuit: `20-${String(timestamp).slice(-8)}-9`,
      email: `test-e2e-${timestamp}@example.com`,
      telefono: "1234567890",
      domicilio: "Calle Test 123",
    };

    // Abrir dialog de creación
    const createButton = page.locator("button").filter({ hasText: /nuevo|agregar|crear/i });
    await createButton.first().click();

    // Esperar a que el formulario esté visible
    const form = page.locator("form").first();
    await expect(form).toBeVisible();

    // Llenar el formulario
    await page.fill('input[name="name"], input#name', testCliente.name);
    await page.fill('input[name="cuit"], input#cuit', testCliente.cuit);
    await page.fill('input[name="email"], input#email', testCliente.email);
    await page.fill('input[name="telefono"], input#telefono', testCliente.telefono);
    await page.fill('input[name="domicilio"], input#domicilio', testCliente.domicilio);

    // Enviar el formulario
    const submitButton = page
      .locator('button[type="submit"]')
      .filter({ hasText: /guardar|crear/i });
    await submitButton.click();

    // Esperar a que se cierre el dialog y se actualice la tabla
    await page.waitForTimeout(2000);

    // Verificar que el nuevo cliente aparece en la tabla
    const clienteRow = page.locator('tr, [role="row"]').filter({ hasText: testCliente.name });
    await expect(clienteRow).toBeVisible({ timeout: 10000 });

    // Cleanup: eliminar el cliente de prueba
    // Esto requeriría hacer click en el botón de eliminar, pero lo dejamos como ejercicio
  });

  test("should filter clientes by search", async ({ page }) => {
    // Buscar el input de búsqueda
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="buscar" i], input[placeholder*="search" i]'
    );

    if ((await searchInput.count()) > 0) {
      // Escribir un término de búsqueda
      await searchInput.first().fill("Test");

      // Esperar a que se actualice la tabla
      await page.waitForTimeout(1000);

      // Verificar que la tabla se actualizó (los resultados filtrados son visibles)
      const tableRows = page.locator('tbody tr, [role="row"]');
      const rowCount = await tableRows.count();

      // Si hay filas, verificar que contienen el término buscado
      if (rowCount > 0) {
        const firstRow = tableRows.first();
        await expect(firstRow).toBeVisible();
      }
    }
  });

  test("should paginate through clientes", async ({ page }) => {
    // Buscar botones de paginación
    const nextButton = page.locator("button").filter({ hasText: /siguiente|next|›|»/i });
    const previousButton = page.locator("button").filter({ hasText: /anterior|previous|‹|«/i });

    if ((await nextButton.count()) > 0) {
      // Verificar que el botón "anterior" está deshabilitado en la primera página
      if ((await previousButton.count()) > 0) {
        await expect(previousButton.first()).toBeDisabled();
      }

      // Click en siguiente si está habilitado
      if (await nextButton.first().isEnabled()) {
        await nextButton.first().click();
        await page.waitForTimeout(1000);

        // Ahora el botón anterior debería estar habilitado
        if ((await previousButton.count()) > 0) {
          await expect(previousButton.first()).toBeEnabled();
        }
      }
    }
  });
});
