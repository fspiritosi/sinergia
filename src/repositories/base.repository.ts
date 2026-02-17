import { PrismaClient } from "@/generated/client";
import prisma from "@/lib/db";
import { dbLogger } from "@/lib/logger";

/**
 * Paginated result interface
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  pageCount: number;
  page: number;
  pageSize: number;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  filters?: Record<string, any>;
}

/**
 * Base Repository - Provides common CRUD operations
 *
 * @template T - The entity type (e.g., Cliente, Propuesta)
 * @template TCreateInput - The type for creating an entity
 * @template TUpdateInput - The type for updating an entity
 */
export abstract class BaseRepository<
  T extends { id: string },
  TCreateInput = Partial<T>,
  TUpdateInput = Partial<T>
> {
  protected prisma: PrismaClient;
  protected abstract modelName: string;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Get the Prisma delegate for this model
   * Must be implemented by each repository
   */
  protected abstract getDelegate(): any;

  /**
   * Build the 'where' clause for search functionality
   * Can be overridden by subclasses for custom search logic
   */
  protected abstract buildSearchWhere(search: string): any;

  /**
   * Default include relations - can be overridden
   */
  protected getDefaultInclude(): any {
    return undefined;
  }

  /**
   * Default order by - can be overridden
   */
  protected getDefaultOrderBy(): any {
    return { createdAt: "desc" };
  }

  /**
   * Find all records
   */
  async findMany(options?: {
    where?: any;
    include?: any;
    orderBy?: any;
  }): Promise<T[]> {
    try {
      const delegate = this.getDelegate();
      return await delegate.findMany({
        where: options?.where,
        include: options?.include ?? this.getDefaultInclude(),
        orderBy: options?.orderBy ?? this.getDefaultOrderBy(),
      });
    } catch (error) {
      dbLogger.error(
        { error, modelName: this.modelName },
        `Error finding all ${this.modelName}`
      );
      throw error;
    }
  }

  /**
   * Find a single record by ID
   */
  async findById(
    id: string,
    options?: { include?: any }
  ): Promise<T | null> {
    try {
      const delegate = this.getDelegate();
      return await delegate.findUnique({
        where: { id },
        include: options?.include ?? this.getDefaultInclude(),
      });
    } catch (error) {
      dbLogger.error(
        { error, modelName: this.modelName, id },
        `Error finding ${this.modelName} by ID`
      );
      throw error;
    }
  }

  /**
   * Find records with pagination
   */
  async findPaginated(
    params: PaginationParams
  ): Promise<PaginatedResult<T>> {
    try {
      const { page, pageSize, search, filters } = params;
      const skip = (page - 1) * pageSize;

      const where: any = {
        ...filters,
      };

      // Add search conditions if search term is provided
      if (search) {
        const searchWhere = this.buildSearchWhere(search);
        where.OR = searchWhere.OR;
      }

      const delegate = this.getDelegate();

      const [data, total] = await Promise.all([
        delegate.findMany({
          where,
          skip,
          take: pageSize,
          include: this.getDefaultInclude(),
          orderBy: this.getDefaultOrderBy(),
        }),
        delegate.count({ where }),
      ]);

      return {
        data,
        total,
        pageCount: Math.ceil(total / pageSize),
        page,
        pageSize,
      };
    } catch (error) {
      dbLogger.error(
        { error, modelName: this.modelName, params },
        `Error finding paginated ${this.modelName}`
      );
      throw error;
    }
  }

  /**
   * Create a new record
   */
  async create(data: TCreateInput): Promise<T> {
    try {
      const delegate = this.getDelegate();
      const created = await delegate.create({
        data,
        include: this.getDefaultInclude(),
      });

      dbLogger.info(
        { modelName: this.modelName, id: created.id },
        `${this.modelName} created successfully`
      );

      return created;
    } catch (error) {
      dbLogger.error(
        { error, modelName: this.modelName, data },
        `Error creating ${this.modelName}`
      );
      throw error;
    }
  }

  /**
   * Update an existing record
   */
  async update(id: string, data: TUpdateInput): Promise<T> {
    try {
      const delegate = this.getDelegate();
      const updated = await delegate.update({
        where: { id },
        data,
        include: this.getDefaultInclude(),
      });

      dbLogger.info(
        { modelName: this.modelName, id },
        `${this.modelName} updated successfully`
      );

      return updated;
    } catch (error) {
      dbLogger.error(
        { error, modelName: this.modelName, id, data },
        `Error updating ${this.modelName}`
      );
      throw error;
    }
  }

  /**
   * Delete a record
   */
  async delete(id: string): Promise<T> {
    try {
      const delegate = this.getDelegate();
      const deleted = await delegate.delete({
        where: { id },
      });

      dbLogger.info(
        { modelName: this.modelName, id },
        `${this.modelName} deleted successfully`
      );

      return deleted;
    } catch (error) {
      dbLogger.error(
        { error, modelName: this.modelName, id },
        `Error deleting ${this.modelName}`
      );
      throw error;
    }
  }

  /**
   * Count records matching a condition
   */
  async count(where?: any): Promise<number> {
    try {
      const delegate = this.getDelegate();
      return await delegate.count({ where });
    } catch (error) {
      dbLogger.error(
        { error, modelName: this.modelName, where },
        `Error counting ${this.modelName}`
      );
      throw error;
    }
  }

  /**
   * Check if a record exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const count = await this.count({ id });
      return count > 0;
    } catch (error) {
      dbLogger.error(
        { error, modelName: this.modelName, id },
        `Error checking if ${this.modelName} exists`
      );
      throw error;
    }
  }
}
