import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto, EditProductDto } from './dto';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(private prisma: PrismaService) {}

  async getProducts(filters: {
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }) {
    try {
      const { search, sortBy, order } = filters;
      const where: any = {};
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [products, total] = await Promise.all([
        this.prisma.products.findMany({
          where,
          orderBy: { [sortBy || 'createdAt']: order || 'desc' },
        }),
        this.prisma.products.count({ where }),
      ]);

      return {
        success: true,
        data: products,
        total,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve products: ${error.message}`);
    }
  }

  async getExportProducts(filters: {
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }) {
    try {
      const { search, sortBy, order } = filters;
      const where: any = {};
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [products, total] = await Promise.all([
        this.prisma.products.findMany({
          where,
          orderBy: { [sortBy || 'createdAt']: order || 'desc' },
        }),
        this.prisma.products.count({ where }),
      ]);

      return {
        success: true,
        data: products,
        total,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve products: ${error.message}`);
    }
  }

  async getProductById(id: number) {
    try {
      const product = await this.prisma.products.findUnique({
        where: { id },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      return { success: true, data: product };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException(`Failed to retrieve product: ${error.message}`);
    }
  }

  async createProduct(payload: CreateProductDto) {
    try {
      const product = await this.prisma.products.create({
        data: { ...payload },
      });

      return { success: true, data: product };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Product with this code already exists');
      }
      
      throw new BadRequestException(`Failed to create product: ${error.message}`);
    }
  }

  async createMultipleProducts(payload: CreateProductDto[]) {
    try {
      const results = [];
      const errors = [];

      for (let i = 0; i < payload.length; i++) {
        try {
          const result = await this.createProduct(payload[i]);
          results.push({ index: i, success: true, data: result.data });
        } catch (error) {
          this.logger.warn(`Failed to create product at index ${i}: ${error.message}`);
          errors.push({
            index: i,
            product_code: payload[i].code,
            error: error.message,
          });
        }
      }

      return {
        success: errors.length === 0,
        total: payload.length,
        created: results.length,
        failed: errors.length,
        data: {
          successful: results,
          failed: errors,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to process multiple products: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to process multiple products: ${error.message}`);
    }
  }

  async editProductById(id: number, payload: EditProductDto) {
    try {
      const existingProduct = await this.prisma.products.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      const result = await this.prisma.products.update({
        data: { ...payload },
        where: { id },
      });

      return { success: true, data: result };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error.code === 'P2002') {
        throw new BadRequestException('Product with this code already exists');
      }

      throw new BadRequestException(`Failed to update product: ${error.message}`);
    }
  }

  async deleteProductById(id: number) {
    try {
      const existingProduct = await this.prisma.products.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      await this.prisma.products.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error.code === 'P2003') {
        throw new BadRequestException('Cannot delete product: it is referenced by other records');
      }

      throw new BadRequestException(`Failed to delete product: ${error.message}`);
    }
  }
}