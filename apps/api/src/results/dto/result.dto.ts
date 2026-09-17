import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateResultDto {
  @IsUUID()
  studentId!: string;

  @IsUUID()
  moduleId!: string;

  @IsInt()
  @Min(1)
  @Max(10)
  attempt!: number;

  @IsString()
  grade!: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  marks?: number;

  @IsInt()
  @Min(1990)
  @Max(2200)
  examinationYear!: number;

  @IsEnum(['DRAFT', 'PUBLISHED', 'WITHHELD'])
  status!: 'DRAFT' | 'PUBLISHED' | 'WITHHELD';
}

export class UpdateResultDto {
  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  marks?: number;

  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'WITHHELD'])
  status?: 'DRAFT' | 'PUBLISHED' | 'WITHHELD';
}

export class ListResultsDto {
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  level?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  semester?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  examinationYear?: number;
}
