import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator.js';
import {
  CreateModuleDto,
  ListModulesDto,
  UpdateModuleDto,
} from './dto/module.dto.js';
import { ModulesService } from './modules.service.js';

@ApiTags('Academic modules')
@ApiBearerAuth()
@Controller('modules')
export class ModulesController {
  constructor(private readonly modules: ModulesService) {}

  @Get()
  list(@Query() query: ListModulesDto) {
    return this.modules.list(query);
  }

  @Get('catalogs')
  catalogs() {
    return this.modules.catalogs();
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateModuleDto) {
    return this.modules.create(dto);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateModuleDto) {
    return this.modules.update(id, dto);
  }
}
