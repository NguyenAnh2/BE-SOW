import { Type } from "class-transformer";
import { IsArray, ValidateNested } from "class-validator";
import { CreateTranslationDto } from "./create-translation.dto";

export class BulkCreateTranslationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTranslationDto)
  items: CreateTranslationDto[];
}
