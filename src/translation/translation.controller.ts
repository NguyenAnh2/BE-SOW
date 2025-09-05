import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';
import { TranslationService } from './translation.service';
import { BulkCreateTranslationDto, CreateTranslationDto, EditTranslationDto } from './dto';

@Controller('translations')
export class TranslationController {
  private readonly logger = new Logger(TranslationController.name);

  constructor(private translationService: TranslationService) {}

  @Get()
  async getTerms(@Query('lang') lang: string) {
    try {
      return await this.translationService.getTranslations(lang);
    } catch (error) {
      this.logger.error(`Failed to get translations for language ${lang}: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new HttpException(
        `Failed to retrieve translations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @UseGuards(JwtGuard)
  async createTranslation(
    @GetUser('id') userId: number,
    @Body() payload: CreateTranslationDto,
  ) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      return await this.translationService.createTranslation(userId, payload);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new HttpException(
        `Failed to create translation: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('bulk')
  @UseGuards(JwtGuard)
  async bulkCreateTranslations(
    @GetUser('id') userId: number,
    @Body() payload: BulkCreateTranslationDto,
  ) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      if (!payload || !payload.items) {
        throw new BadRequestException('Payload must contain items array');
      }

      return await this.translationService.bulkCreateTranslations(
        userId,
        payload.items,
      );
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new HttpException(
        `Failed to create translations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('')
  @UseGuards(JwtGuard)
  async editTermById(
    @GetUser('id') userId: number,
    @Query('key') key: string,
    @Body() payload: EditTranslationDto,
  ) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      if (!key) {
        throw new BadRequestException('Key query parameter is required');
      }

      return await this.translationService.editTranslationByKey(userId, key, payload);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      
      throw new HttpException(
        `Failed to update translation: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('')
  @UseGuards(JwtGuard)
  async deleteTermById(
    @GetUser('id') userId: number, 
    @Query('key') key: string
  ) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      if (!key) {
        throw new BadRequestException('Key query parameter is required');
      }

      return await this.translationService.deleteTranslationByKey(userId, key);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      
      throw new HttpException(
        `Failed to delete translation: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}