import { 
  Injectable, 
  Logger, 
  BadRequestException, 
  NotFoundException 
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EditUserDto } from './dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  getMe(user: any) {
    try {
      if (!user) {
        throw new BadRequestException('User data is required');
      }

      const { password, ...userData } = user;
      
      return { success: true, data: userData };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException(`Failed to retrieve user profile: ${error.message}`);
    }
  }

  async updateMe(userId: number, payload: EditUserDto) {
    try {
      if (!userId || userId <= 0) {
        throw new BadRequestException('Valid user ID is required');
      }

      if (!payload || Object.keys(payload).length === 0) {
        throw new BadRequestException('Update payload is required');
      }

      const userToUpdate = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!userToUpdate) {
        throw new NotFoundException('User not found');
      }

      const result = await this.prisma.user.update({
        where: { id: userId },
        data: { ...payload },
      });

      const { password, ...userData } = result;

      return { success: true, data: userData };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }

      throw new BadRequestException(`Failed to update user profile: ${error.message}`);
    }
  }
}