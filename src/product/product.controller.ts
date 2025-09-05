import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  StreamableFile
} from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { CreateProductDto, EditProductDto } from './dto';
import { ProductService } from './product.service';

@Controller('products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(private productService: ProductService) {}

  @Get()
  async getProducts(
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    try {
      return await this.productService.getProducts({ search, sortBy, order });
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new HttpException(
        `Failed to retrieve products: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('export')
  async getExportProducts(
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    try {
      const { data: products } = await this.productService.getProducts({
        search,
        sortBy,
        order,
      });
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Products');

      if (products.length > 0) {
        worksheet.addRow(Object.keys(products[0]));
        products.forEach((product) => {
          worksheet.addRow(Object.values(product));
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();

      const uint8Array = new Uint8Array(buffer);

      return new StreamableFile(uint8Array, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        disposition: 'attachment; filename="products.xlsx"',
      });
    } catch (error) {
      throw new HttpException(
        'Failed to export products',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getProductById(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.productService.getProductById(id);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new HttpException(
        `Failed to retrieve product: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createProduct(@Body() payload: CreateProductDto) {
    try {
      return await this.productService.createProduct(payload);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new HttpException(
        `Failed to create product: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('bulk')
  async createMultipleProducts(@Body() payload: CreateProductDto[]) {
    try {
      if (!Array.isArray(payload) || payload.length === 0) {
        throw new BadRequestException('Payload must be a non-empty array');
      }

      return await this.productService.createMultipleProducts(payload);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new HttpException(
        `Failed to create products: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @HttpCode(HttpStatus.OK)
  @Put(':id')
  async editProductById(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: EditProductDto,
  ) {
    try {
      return await this.productService.editProductById(id, payload);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new HttpException(
        `Failed to update product: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  async deleteProductById(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.productService.deleteProductById(id);
    } catch (error) {

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new HttpException(
        `Failed to delete product: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
