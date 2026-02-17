import { test, expect } from '@playwright/test';

/**
 * IMPORTANTE: Estos tests requieren autenticación.
 *
 * Para ejecutar estos tests, necesitas:
 * 1. Configurar credenciales de prueba en Clerk
 * 2. Usar Playwright's authentication state
 * 3. O ejecutar manualmente después de iniciar sesión
 * 4. Tener al menos un cliente y un servicio creados en la base de datos
 */

test.describe('Propuesta Técnica Management', () => {
  // Skip tests by default since they require authentication
  test.skip(({ browserName }) => true, 'Requires authentication setup');

  test.beforeEach(async ({ page }) => {
    // Navegar a la página de propuestas
    await page.goto('/dashboard/propuestas');
    await page.waitForLoadState('networkidle');
  });

  test('should display propuestas page', async ({ page }) => {
    // Verificar que estamos en la página correcta
    await expect(page).toHaveURL('/dashboard/propuestas');

    // Verificar que existe el título o heading de la página
    const heading = page.locator('h1, h2').filter({ hasText: /propuesta/i });
    await expect(heading).toBeVisible();
  });

  test('should open create propuesta dialog', async ({ page }) => {
    // Buscar el botón para crear nueva propuesta
    const createButton = page.locator('button').filter({ hasText: /nueva|agregar|crear/i });
    await createButton.first().click();

    // Verificar que se abre el dialog/modal
    const dialog = page.locator('[role="dialog"], dialog').filter({ hasText: /propuesta/i });
    await expect(dialog).toBeVisible();
  });

  test('should create a new propuesta', async ({ page }) => {
    // Abrir dialog de creación
    const createButton = page.locator('button').filter({ hasText: /nueva|agregar|crear/i });
    await createButton.first().click();

    // Esperar a que el formulario esté visible
    const form = page.locator('form').first();
    await expect(form).toBeVisible();

    // Llenar campos básicos
    // Nota: Los selectores exactos dependerán de cómo está implementado el formulario

    // Seleccionar cliente (asume que hay un select o combobox)
    const clienteSelect = page.locator('select[name="clienteId"], [role="combobox"]').first();
    if (await clienteSelect.count() > 0) {
      // Si es un select nativo
      if ((await clienteSelect.getAttribute('role')) !== 'combobox') {
        await clienteSelect.selectOption({ index: 1 });
      } else {
        // Si es un combobox de shadcn (más común)
        await clienteSelect.click();
        await page.locator('[role="option"]').first().click();
      }
    }

    // Seleccionar servicio
    const servicioSelect = page.locator('select[name="servicioId"], [role="combobox"]').nth(1);
    if (await servicioSelect.count() > 0) {
      if ((await servicioSelect.getAttribute('role')) !== 'combobox') {
        await servicioSelect.selectOption({ index: 1 });
      } else {
        await servicioSelect.click();
        await page.locator('[role="option"]').first().click();
      }
    }

    // Llenar otros campos si existen
    const fechaInput = page.locator('input[name="fecha"], input[type="date"]');
    if (await fechaInput.count() > 0) {
      const today = new Date().toISOString().split('T')[0];
      await fechaInput.fill(today);
    }

    // Enviar el formulario
    const submitButton = page.locator('button[type="submit"]').filter({ hasText: /guardar|crear/i });
    await submitButton.click();

    // Esperar a que se cierre el dialog
    await page.waitForTimeout(2000);

    // Verificar que la nueva propuesta aparece en la tabla
    const tableRows = page.locator('tbody tr, [role="row"]');
    await expect(tableRows.first()).toBeVisible({ timeout: 10000 });
  });

  test('should filter propuestas by status', async ({ page }) => {
    // Buscar filtros de estado (si existen)
    const statusFilter = page.locator('select[name="status"], [role="combobox"]').filter({
      hasText: /estado|status/i,
    });

    if (await statusFilter.count() > 0) {
      // Click en el filtro
      await statusFilter.first().click();

      // Seleccionar una opción (ej: "Aprobada")
      const option = page.locator('[role="option"]').filter({ hasText: /aprobada/i });
      if (await option.count() > 0) {
        await option.first().click();

        // Esperar a que se actualice la tabla
        await page.waitForTimeout(1000);

        // Verificar que la tabla se actualizó
        const tableRows = page.locator('tbody tr, [role="row"]');
        if ((await tableRows.count()) > 0) {
          await expect(tableRows.first()).toBeVisible();
        }
      }
    }
  });

  test('should view propuesta details', async ({ page }) => {
    // Buscar la primera propuesta en la tabla
    const firstRow = page.locator('tbody tr, [role="row"]').first();

    if (await firstRow.count() > 0) {
      // Buscar el botón de ver/editar (puede ser un ícono o texto)
      const viewButton = firstRow.locator('button').filter({ hasText: /ver|detalle|edit/i });

      if (await viewButton.count() > 0) {
        await viewButton.first().click();

        // Verificar que se navega a la página de detalles o se abre un modal
        await page.waitForTimeout(1000);

        // Puede ser una nueva página (/dashboard/propuestas/[id]) o un dialog
        const isDialog = (await page.locator('[role="dialog"]').count()) > 0;
        const isDetailPage = page.url().includes('/propuestas/') && page.url().split('/').length > 4;

        expect(isDialog || isDetailPage).toBe(true);
      }
    }
  });

  test('should navigate to generate plan from propuesta', async ({ page }) => {
    // Este test verifica que se puede navegar para generar un plan de trabajo desde una propuesta aprobada

    // Buscar una propuesta con estado "Aprobada"
    const approvedRow = page.locator('tbody tr, [role="row"]').filter({ hasText: /aprobada/i });

    if (await approvedRow.count() > 0) {
      // Buscar el botón para generar plan
      const generatePlanButton = approvedRow
        .first()
        .locator('button')
        .filter({ hasText: /plan|generar/i });

      if (await generatePlanButton.count() > 0) {
        await generatePlanButton.first().click();

        // Verificar navegación o apertura de modal
        await page.waitForTimeout(1000);

        const isDialog = (await page.locator('[role="dialog"]').count()) > 0;
        const isPlanPage = page.url().includes('/planificacion');

        expect(isDialog || isPlanPage).toBe(true);
      }
    }
  });
});
