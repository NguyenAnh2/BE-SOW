import { 
  ForbiddenException, 
  HttpStatus, 
  Injectable, 
  Logger, 
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signup(dto: AuthDto) {
    try {
      if (!dto.email || !dto.password) {
        throw new BadRequestException('Email and password are required');
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new ForbiddenException('User with this email already exists');
      }

      const hash = await argon.hash(dto.password);

      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hash,
          role: dto.r || 'user',
        },
      });

      const { password, ...userWithoutPassword } = user;

      return {
        success: true,
        data: userWithoutPassword,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('User with this email already exists');
        }
      }

      if (error.message?.includes('argon2')) {
        throw new InternalServerErrorException('Failed to process password');
      }

      throw new InternalServerErrorException('Registration failed');
    }
  }

  async signin(dto: AuthDto) {
    try {
      if (!dto.email || !dto.password) {
        throw new BadRequestException('Email and password are required');
      }

      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const pwMatch = await argon.verify(user.password, dto.password);
      if (!pwMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const access_token = await this.signToken(user.id, user.email, user.role);

      const { password, ...userWithoutPassword } = user;

      return {
        success: true,
        access_token,
        data: userWithoutPassword,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }

      if (error.message?.includes('argon2')) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (error.message?.includes('JWT') || error.name === 'JsonWebTokenError') {
        throw new InternalServerErrorException('Authentication token generation failed');
      }

      throw new InternalServerErrorException('Authentication failed');
    }
  }

  async signToken(userId: number, email: string, role: string): Promise<string> {
    try {
      if (!userId || !email || !role) {
        throw new BadRequestException('User ID, email, and role are required for token generation');
      }

      const payload = {
        sub: userId,
        email,
        per: role,
      };

      const secret = this.config.get('JWT_SECRET');
      
      if (!secret) {
        throw new InternalServerErrorException('Authentication configuration error');
      }

      const token = await this.jwt.signAsync(payload, {
        expiresIn: '30m',
        secret,
      });

      return token;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }

      if (error.name === 'JsonWebTokenError') {
        throw new InternalServerErrorException('Token generation failed');
      }

      throw new InternalServerErrorException('Authentication token generation failed');
    }
  }
}