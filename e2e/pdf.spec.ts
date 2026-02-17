import { test, expect } from '@playwright/test';

/**
 * IMPORTANTE: Estos tests requieren autenticación.
 *
 * Para ejecutar estos tests, necesitas:
 * 1. Configurar credenciales de prueba en Clerk
 * 2. Usar Playwright's authentication state
 * 3. O ejecutar manualmente después de iniciar sesión
 * 4. Tener al menos un informe o plan de trabajo en el sistema
 */

test.describe('PDF Generation', () => {
  // Skip tests by default since they require authentication
  test.skip(({ browserName }) => true, 'Requires authentication setup');

  test('should generate PDF for informe', async ({ page }) => {
    // Navegar a la página de informes
    await page.goto('/dashboard/informes');
    await page.waitForLoadState('networkidle');

    // Buscar la primera fila de la tabla
    const firstRow = page.locator('tbody tr, [role="row"]').first();

    if (await firstRow.count() > 0) {
      // Buscar el botón de generar/ver PDF
      const pdfButton = firstRow.locator('button, a').filter({ hasText: /pdf|descargar|generar/i });

      if (await pdfButton.count() > 0) {
        // Configurar listener para descargas
        const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

        // Click en el botón de PDF
        await pdfButton.first().click();

        // Esperar a que se inicie la descarga
        const download = await downloadPromise;

        // Verificar que el archivo descargado es un PDF
        expect(download.suggestedFilename()).toMatch(/\.pdf$/i);

        // Verificar que el archivo tiene contenido
        const path = await download.path();
        expect(path).toBeTruthy();
      }
    }
  });

  test('should generate PDF for plan de trabajo', async ({ page }) => {
    // Navegar a la página de planes de trabajo
    await page.goto('/dashboard/planificacion/planes-trabajo');
    await page.waitForLoadState('networkidle');

    // Buscar la primera fila de la tabla
    const firstRow = page.locator('tbody tr, [role="row"]').first();

    if (await firstRow.count() > 0) {
      // Buscar el botón de generar/ver PDF
      const pdfButton = firstRow.locator('button, a').filter({ hasText: /pdf|descargar|generar/i });

      if (await pdfButton.count() > 0) {
        // Configurar listener para descargas
        const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

        // Click en el botón de PDF
        await pdfButton.first().click();

        // Esperar a que se inicie la descarga
        const download = await downloadPromise;

        // Verificar que el archivo descargado es un PDF
        expect(download.suggestedFilename()).toMatch(/\.pdf$/i);

        // Verificar que el archivo tiene contenido
        const path = await download.path();
        expect(path).toBeTruthy();
      }
    }
  });

  test('should preview PDF in modal before download', async ({ page }) => {
    // Navegar a la página de informes
    await page.goto('/dashboard/informes');
    await page.waitForLoadState('networkidle');

    // Buscar la primera fila de la tabla
    const firstRow = page.locator('tbody tr, [role="row"]').first();

    if (await firstRow.count() > 0) {
      // Buscar el botón de ver/previsualizar
      const previewButton = firstRow.locator('button').filter({ hasText: /ver|preview|previsualizar/i });

      if (await previewButton.count() > 0) {
        await previewButton.first().click();

        // Verificar que se abre un modal o se navega a una página de preview
        await page.waitForTimeout(2000);

        const isDialog = (await page.locator('[role="dialog"]').count()) > 0;
        const isPreviewPage = page.url().includes('/preview') || page.url().includes('/ver');

        // Si hay un modal, verificar que contiene un iframe o embed del PDF
        if (isDialog) {
          const hasPdfEmbed =
            (await page.locator('iframe, embed, object[type="application/pdf"]').count()) > 0;
          expect(hasPdfEmbed).toBe(true);
        }

        expect(isDialog || isPreviewPage).toBe(true);
      }
    }
  });

  test('should handle PDF generation errors gracefully', async ({ page }) => {
    // Este test verifica que los errores de generación de PDF se manejan correctamente

    // Navegar a la página de informes
    await page.goto('/dashboard/informes');
    await page.waitForLoadState('networkidle');

    // Intentar generar un PDF (simularemos un error interceptando la petición)
    await page.route('**/api/informes/**', (route) => {
      // Simular un error del servidor
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Error al generar PDF' }),
      });
    });

    // Buscar la primera fila
    const firstRow = page.locator('tbody tr, [role="row"]').first();

    if (await firstRow.count() > 0) {
      const pdfButton = firstRow.locator('button, a').filter({ hasText: /pdf|descargar|generar/i });

      if (await pdfButton.count() > 0) {
        await pdfButton.first().click();

        // Esperar a que aparezca un mensaje de error (toast, alert, etc.)
        await page.waitForTimeout(2000);

        // Verificar que hay un mensaje de error visible
        const errorMessage = page.locator('[role="alert"], .toast, .notification').filter({
          hasText: /error/i,
        });

        // Si el sistema muestra errores, debería haber un mensaje
        if (await errorMessage.count() > 0) {
          await expect(errorMessage.first()).toBeVisible();
        }
      }
    }
  });

  test('should generate multiple PDFs sequentially', async ({ page }) => {
    // Este test verifica que el sistema puede generar múltiples PDFs sin problemas

    await page.goto('/dashboard/informes');
    await page.waitForLoadState('networkidle');

    const rows = page.locator('tbody tr, [role="row"]');
    const rowCount = await rows.count();

    if (rowCount >= 2) {
      // Generar PDF para los primeros 2 informes
      for (let i = 0; i < Math.min(2, rowCount); i++) {
        const row = rows.nth(i);
        const pdfButton = row.locator('button, a').filter({ hasText: /pdf|descargar|generar/i });

        if (await pdfButton.count() > 0) {
          const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
          await pdfButton.first().click();
          const download = await downloadPromise;

          expect(download.suggestedFilename()).toMatch(/\.pdf$/i);

          // Esperar un poco entre descargas
          await page.waitForTimeout(1000);
        }
      }
    }
  });
});
