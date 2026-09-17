import { PartialType, PickType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateUserDto } from './create-user.dto.js';

export class UpdateUserDto extends PartialType(
  PickType(CreateUserDto, [
    'email',
    'fullName',
    'role',
    'indexNumber',
    'staffNumber',
    'batchYear',
    'programmeId',
  ] as const),
) {
  @IsOptional()
  @IsEnum(['ACTIVE', 'SUSPENDED', 'ARCHIVED'])
  status?: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
}
