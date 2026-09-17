import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  fullName!: string;

  @ApiProperty({ minLength: 12 })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ enum: ['ADMIN', 'LECTURER', 'STUDENT'] })
  @IsEnum(['ADMIN', 'LECTURER', 'STUDENT'])
  role!: 'ADMIN' | 'LECTURER' | 'STUDENT';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  indexNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  staffNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1990)
  @Max(2200)
  batchYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  programmeId?: string;
}
