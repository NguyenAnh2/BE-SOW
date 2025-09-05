import { 
  ForbiddenException, 
  Injectable, 
  Logger, 
  BadRequestException, 
  NotFoundException 
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTranslationDto, EditTranslationDto } from './dto';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  constructor(private prisma: PrismaService) {}

  async getTranslations(language: string) {
    try {
      if (!language) {
        throw new BadRequestException('Language parameter is required');
      }

      const translations = await this.prisma.translations.findMany({
        where: { language },
      });

      const grouped: Record<string, any> = {};
      
      for (const t of translations) {
        try {
          const parts = t.key.split('.');
          let current = grouped;
          
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === parts.length - 1) {
              current[part] = t.value;
            } else {
              if (!current[part]) {
                current[part] = {};
              }
              current = current[part];
            }
          }
        } catch (keyError) {
          this.logger.warn(`Failed to process translation key ${t.key}: ${keyError.message}`);
        }
      }

      return { success: true, data: grouped, lang: language };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException(`Failed to retrieve translations: ${error.message}`);
    }
  }

  async createTranslation(userId: number, payload: CreateTranslationDto) {
    try {
      const user = await this.checkUserPermissions(userId);

      const existingTranslation = await this.prisma.translations.findFirst({
        where: { 
          key: payload.key, 
          language: payload.language 
        },
      });

      if (existingTranslation) {
        throw new BadRequestException('Translation with this key and language already exists');
      }

      const term = await this.prisma.translations.create({
        data: { ...payload },
      });

      return { success: true, data: term };
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }

      if (error.code === 'P2002') {
        throw new BadRequestException('Translation with this key and language already exists');
      }

      throw new BadRequestException(`Failed to create translation: ${error.message}`);
    }
  }

  async bulkCreateTranslations(userId: number, items: CreateTranslationDto[]) {
    try {
      await this.checkUserPermissions(userId);

      if (!Array.isArray(items) || items.length === 0) {
        throw new BadRequestException('Items must be a non-empty array');
      }

      for (const item of items) {
        if (!item.key || !item.language || !item.value) {
          throw new BadRequestException('Each item must have key, language, and value');
        }
      }

      const created = await this.prisma.translations.createMany({
        data: items.map((i) => ({
          key: i.key,
          language: i.language,
          value: i.value,
        })),
        skipDuplicates: true,
      });

      return { success: true, count: created.count };
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(`Failed to create translations: ${error.message}`);
    }
  }

  async editTranslationByKey(
    userId: number,
    key: string,
    payload: EditTranslationDto,
  ) {
    try {
      await this.checkUserPermissions(userId);

      if (!key) {
        throw new BadRequestException('Key parameter is required');
      }

      if (!payload.language) {
        throw new BadRequestException('Language is required in payload');
      }

      const translation = await this.prisma.translations.findFirst({
        where: { key: key, language: payload.language },
      });

      if (!translation) {
        throw new NotFoundException('Translation not found');
      }

      const result = await this.prisma.translations.update({
        data: { ...payload },
        where: { id: translation.id },
      });

      return { success: true, data: result };
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException(`Failed to update translation: ${error.message}`);
    }
  }

  async deleteTranslationByKey(userId: number, key: string) {
    try {
      await this.checkUserPermissions(userId);
      if (!key) {
        throw new BadRequestException('Key parameter is required');
      }

      const translation = await this.prisma.translations.findFirst({
        where: { key },
      });

      if (!translation) {
        throw new NotFoundException('Translation not found');
      }

      await this.prisma.translations.delete({ where: { id: translation.id } });
      return { success: true };
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException(`Failed to delete translation: ${error.message}`);
    }
  }

  private async checkUserPermissions(userId: number) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      
      if (!user) {
        throw new NotFoundException('User not found');
      }
      
      if (user.role !== 'admin') {
        throw new ForbiddenException('Access denied! Admin role required');
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      this.logger.error(`Failed to check user permissions for user ${userId}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to verify user permissions');
    }
  }
}