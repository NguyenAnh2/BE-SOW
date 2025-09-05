import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTranslationDto {
  @IsNotEmpty()
  @IsString()
  key: string;

  @IsNotEmpty()
  @IsString()
  language: string;

  @IsNotEmpty()
  @IsString()
  value: string;
}
