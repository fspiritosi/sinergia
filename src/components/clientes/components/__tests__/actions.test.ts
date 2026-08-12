// @vitest-environment node
//
// Test de integración contra la base real: importa server actions, que a través
// de requirePermission cargan la instancia de better-auth y con ella las
// variables de entorno server-only. Bajo el jsdom por defecto existe `window`,
// así que @t3-oss/env las bloquea por considerarlo código de cliente.
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";

// Este test ejercita el CRUD contra la base, no el RBAC: sin una sesión
// simulada, `requirePermission` rechaza cada llamada y nada puede correr.
vi.mock("@/lib/rbac/require", () => ({
  requirePermission: vi.fn().mockResolvedValue({ id: "test-admin", isActive: true }),
  requireRole: vi.fn().mockResolvedValue({ id: "test-admin", isActive: true }),
  hasPermission: vi.fn().mockResolvedValue(true),
}));

import { getClientes, getClientesPaginated, getClienteById } from "../actions";
import { createCliente, updateCliente, deleteCliente } from "../cliente-actions";
import prisma from "@/lib/db";
import type { Cliente } from "@/generated/client";

// Run tests sequentially to avoid database conflicts
describe.sequential("Cliente Integration Tests", () => {
  let testClienteId: string | null = null;
  const uniqueSuffix = Date.now();

  // Test data with unique values to avoid conflicts
  const testClienteData: Partial<Cliente> = {
    name: `Test Cliente ${uniqueSuffix}`,
    cuit: `20-${String(uniqueSuffix).slice(-8)}-9`,
    email: `test${uniqueSuffix}@test.com`,
    telefono: "1234567890",
    domicilio: "Test Address 123",
    is_active: true,
  };

  // Cleanup function to ensure test data is removed
  const cleanupTestCliente = async () => {
    if (testClienteId) {
      try {
        await prisma.cliente.delete({ where: { id: testClienteId } });
      } catch (error) {
        // Cliente might already be deleted, ignore error
      }
      testClienteId = null;
    }
  };

  // Clean up before all tests (in case previous run failed)
  beforeAll(async () => {
    // Try to find and delete any existing test cliente with same CUIT
    const existing = await prisma.cliente.findUnique({
      where: { cuit: testClienteData.cuit },
    });
    if (existing) {
      await prisma.cliente.delete({ where: { id: existing.id } });
    }
  });

  // Clean up after all tests
  afterAll(async () => {
    await cleanupTestCliente();
    await prisma.$disconnect();
  });

  describe("getClientes", () => {
    it("should return an array of clientes", async () => {
      const clientes = await getClientes();

      expect(clientes).toBeInstanceOf(Array);
      expect(clientes.length).toBeGreaterThanOrEqual(0);

      // If there are clientes, verify structure
      if (clientes.length > 0) {
        const cliente = clientes[0];
        expect(cliente).toHaveProperty("id");
        expect(cliente).toHaveProperty("name");
        expect(cliente).toHaveProperty("cuit");
        expect(cliente).toHaveProperty("email");
      }
    });

    it("should include provincia and ciudad relations", async () => {
      const clientes = await getClientes();

      if (clientes.length > 0) {
        const cliente = clientes[0];
        // These might be null, but the property should exist
        expect(cliente).toHaveProperty("provincia");
        expect(cliente).toHaveProperty("ciudad");
        expect(cliente).toHaveProperty("clientLocations");
      }
    });

    it("should order by is_active desc, then name asc", async () => {
      const clientes = await getClientes();

      if (clientes.length > 1) {
        // Verify active clientes come first
        const activeClientes = clientes.filter((c) => c.is_active);
        const inactiveClientes = clientes.filter((c) => !c.is_active);

        if (activeClientes.length > 0 && inactiveClientes.length > 0) {
          const lastActiveIndex = clientes.findIndex(
            (c) => c.id === activeClientes[activeClientes.length - 1].id
          );
          const firstInactiveIndex = clientes.findIndex((c) => c.id === inactiveClientes[0].id);
          expect(lastActiveIndex).toBeLessThan(firstInactiveIndex);
        }
      }
    });
  });

  describe("getClientesPaginated", () => {
    it("should return paginated results", async () => {
      const result = await getClientesPaginated({
        page: 1,
        pageSize: 10,
      });

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("pageCount");
      expect(result.data).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.pageCount).toBeGreaterThanOrEqual(0);
    });

    it("should respect page size", async () => {
      const result = await getClientesPaginated({
        page: 1,
        pageSize: 5,
      });

      expect(result.data.length).toBeLessThanOrEqual(5);
    });

    it("should filter by search term", async () => {
      // First create a test cliente
      const createResult = await createCliente(testClienteData as Cliente);
      expect(createResult.success).toBe(true);

      // Get the created cliente
      const created = await prisma.cliente.findUnique({
        where: { cuit: testClienteData.cuit },
      });
      testClienteId = created!.id;

      // Search for it
      const result = await getClientesPaginated({
        page: 1,
        pageSize: 10,
        search: testClienteData.name,
      });

      expect(result.data.length).toBeGreaterThan(0);
      const found = result.data.find((c) => c.id === testClienteId);
      expect(found).toBeDefined();
    });

    it("should calculate pageCount correctly", async () => {
      const result = await getClientesPaginated({
        page: 1,
        pageSize: 5,
      });

      const expectedPages = Math.ceil(result.total / 5);
      expect(result.pageCount).toBe(expectedPages);
    });
  });

  describe("getClienteById", () => {
    it("should return cliente by id", async () => {
      // Ensure test cliente exists
      if (!testClienteId) {
        const createResult = await createCliente(testClienteData as Cliente);
        expect(createResult.success).toBe(true);
        const created = await prisma.cliente.findUnique({
          where: { cuit: testClienteData.cuit },
        });
        testClienteId = created!.id;
      }

      const cliente = await getClienteById(testClienteId);

      expect(cliente).toBeDefined();
      expect(cliente!.id).toBe(testClienteId);
      expect(cliente!.name).toBe(testClienteData.name);
    });

    it("should include relations in response", async () => {
      if (!testClienteId) {
        const createResult = await createCliente(testClienteData as Cliente);
        expect(createResult.success).toBe(true);
        const created = await prisma.cliente.findUnique({
          where: { cuit: testClienteData.cuit },
        });
        testClienteId = created!.id;
      }

      const cliente = await getClienteById(testClienteId);

      expect(cliente).toHaveProperty("provincia");
      expect(cliente).toHaveProperty("ciudad");
      expect(cliente).toHaveProperty("clientLocations");
      expect(cliente).toHaveProperty("propuestas");
    });

    it("should return null for non-existent id", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000";
      const cliente = await getClienteById(nonExistentId);

      expect(cliente).toBeNull();
    });
  });

  describe("createCliente", () => {
    it("should create a new cliente", async () => {
      // Clean up if exists from previous test
      await cleanupTestCliente();

      const result = await createCliente(testClienteData as Cliente);

      expect(result.success).toBe(true);

      // Verify it was created in database
      const created = await prisma.cliente.findUnique({
        where: { cuit: testClienteData.cuit },
      });

      expect(created).toBeDefined();
      expect(created!.name).toBe(testClienteData.name);
      expect(created!.email).toBe(testClienteData.email);

      testClienteId = created!.id;
    });

    it("should throw error for duplicate CUIT", async () => {
      // Ensure cliente exists
      if (!testClienteId) {
        await createCliente(testClienteData as Cliente);
        const created = await prisma.cliente.findUnique({
          where: { cuit: testClienteData.cuit },
        });
        testClienteId = created!.id;
      }

      // Try to create with same CUIT
      await expect(createCliente(testClienteData as Cliente)).rejects.toThrow();
    });
  });

  describe("updateCliente", () => {
    it("should update an existing cliente", async () => {
      // Ensure cliente exists
      if (!testClienteId) {
        await createCliente(testClienteData as Cliente);
        const created = await prisma.cliente.findUnique({
          where: { cuit: testClienteData.cuit },
        });
        testClienteId = created!.id;
      }

      const updatedName = `Updated ${testClienteData.name}`;
      const result = await updateCliente({
        id: testClienteId,
        name: updatedName,
      });

      expect(result.success).toBe(true);

      // Verify update in database
      const updated = await prisma.cliente.findUnique({
        where: { id: testClienteId },
      });

      expect(updated!.name).toBe(updatedName);
    });

    it("should throw error for non-existent cliente", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      await expect(
        updateCliente({
          id: nonExistentId,
          name: "This should fail",
        })
      ).rejects.toThrow();
    });
  });

  describe("deleteCliente", () => {
    it("should delete an existing cliente", async () => {
      // Ensure cliente exists
      if (!testClienteId) {
        await createCliente(testClienteData as Cliente);
        const created = await prisma.cliente.findUnique({
          where: { cuit: testClienteData.cuit },
        });
        testClienteId = created!.id;
      }

      const result = await deleteCliente(testClienteId);

      expect(result.success).toBe(true);

      // Verify deletion
      const deleted = await prisma.cliente.findUnique({
        where: { id: testClienteId },
      });

      expect(deleted).toBeNull();

      // Clear testClienteId since it's been deleted
      testClienteId = null;
    });

    it("should throw error for non-existent cliente", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      await expect(deleteCliente(nonExistentId)).rejects.toThrow();
    });
  });
});
