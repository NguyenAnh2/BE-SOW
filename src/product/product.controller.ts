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
  Query
} from '@nestjs/common';
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
      this.logger.error(`Failed to get products: ${error.message}`, error.stack);
      
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
      return await this.productService.getExportProducts({ search, sortBy, order });
    } catch (error) {
      this.logger.error(`Failed to get products: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      throw new HttpException(
        `Failed to retrieve products: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getProductById(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.productService.getProductById(id);
    } catch (error) {
      this.logger.error(`Failed to get product by ID ${id}: ${error.message}`, error.stack);
      
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
      this.logger.error(`Failed to create product: ${error.message}`, error.stack);
      
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
      this.logger.error(`Failed to create multiple products: ${error.message}`, error.stack);
      
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
      this.logger.error(`Failed to edit product ID ${id}: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
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
      this.logger.error(`Failed to delete product ID ${id}: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      throw new HttpException(
        `Failed to delete product: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}