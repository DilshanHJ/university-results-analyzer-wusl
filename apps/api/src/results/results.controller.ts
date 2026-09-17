import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import {
  CreateResultDto,
  ListResultsDto,
  UpdateResultDto,
} from './dto/result.dto.js';
import { ResultsService } from './results.service.js';

@ApiTags('Results')
@ApiBearerAuth()
@Controller('results')
export class ResultsController {
  constructor(private readonly results: ResultsService) {}

  @Roles('ADMIN', 'LECTURER')
  @Get('entry-options')
  entryOptions() {
    return this.results.entryOptions();
  }

  @Get()
  list(@Query() query: ListResultsDto, @CurrentUser() user: AuthenticatedUser) {
    return this.results.list(query, user);
  }

  @Get('summary')
  summary(
    @CurrentUser() user: AuthenticatedUser,
    @Query('studentId') studentId?: string,
  ) {
    return this.results.summary(user, studentId);
  }

  @Roles('ADMIN', 'LECTURER')
  @Post()
  create(@Body() dto: CreateResultDto, @CurrentUser() user: AuthenticatedUser) {
    return this.results.create(dto, user);
  }

  @Roles('ADMIN', 'LECTURER')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResultDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.results.update(id, dto, user);
  }

  @Roles('ADMIN', 'LECTURER')
  @ApiConsumes('multipart/form-data')
  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }),
  )
  importCsv(
    @UploadedFile() file: { originalname: string; buffer: Buffer },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException('CSV file is required');
    if (!file.originalname.toLowerCase().endsWith('.csv'))
      throw new BadRequestException('Only CSV files are accepted');
    return this.results.importCsv(file, user);
  }
}
