import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Logger,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: AuthDto) {
    try {
      if (!dto) {
        throw new BadRequestException('Invalid request body');
      }

      return await this.authService.signup(dto);
    } catch (error) {
      if (error instanceof BadRequestException || 
          error instanceof ForbiddenException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }

      if (error.message?.includes('validation')) {
        throw new BadRequestException('Invalid input data');
      }

      throw new HttpException(
        'Registration failed. Please try again.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  async signin(@Body() dto: AuthDto) {
    try {
      if (!dto || typeof dto !== 'object') {
        throw new BadRequestException('Invalid request body');
      }

      return await this.authService.signin(dto);
    } catch (error) {
      if (error instanceof BadRequestException || 
          error instanceof UnauthorizedException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }

      if (error.message?.includes('validation')) {
        throw new BadRequestException('Invalid input data');
      }

      throw new HttpException(
        'Authentication failed. Please check your credentials.',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}