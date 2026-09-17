import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateModuleDto {
  @IsString()
  @MaxLength(32)
  code!: string;

  @IsString()
  @MaxLength(180)
  name!: string;

  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(30)
  credits!: number;

  @IsInt()
  @Min(1)
  @Max(8)
  level!: number;

  @IsInt()
  @Min(1)
  @Max(3)
  semester!: number;

  @IsEnum(['CORE', 'ELECTIVE', 'GENERAL'])
  category!: 'CORE' | 'ELECTIVE' | 'GENERAL';

  @IsOptional()
  @IsUUID()
  departmentId?: string;
}

export class UpdateModuleDto extends PartialType(CreateModuleDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ListModulesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8)
  level?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  semester?: number;
}
