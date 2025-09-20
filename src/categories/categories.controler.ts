/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { AdminPinGuard } from '../common/admin-pin.guard';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

/**
 * Kategorien-Controller.
 *
 * Endpunkte:
 * - `GET /categories`          – alle Kategorien
 * - `POST /categories`         – Kategorie anlegen (**Admin**, `x-admin-pin`)
 * - `DELETE /categories/:id`   – Kategorie löschen (**Admin**)
 *
 * Hinweis: Für saubere Validierung könntest du optional ein DTO
 * `CreateCategoryDto { @IsString() @MinLength(1) name: string }` nutzen.
 */
@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private svc: CategoriesService) {}

  /** Alle Kategorien auflisten. */
  @Get()
  @ApiOperation({ summary: 'Kategorien auflisten' })
  @ApiOkResponse({ description: 'Array von Kategorien' })
  list() {
    return this.svc.list();
  }

  /** Kategorie anlegen (Admin, PIN im Header). */
  @UseGuards(AdminPinGuard)
  @Post()
  @ApiOperation({ summary: 'Kategorie anlegen (Admin)' })
  @ApiSecurity('AdminPin')
  @ApiCreatedResponse({ description: 'Kategorie erstellt' })
  @ApiBadRequestResponse({ description: 'Ungültiger Name' })
  create(@Body('name') name: string) {
    return this.svc.create(name);
  }

  /** Kategorie löschen (Admin, PIN im Header). */
  @UseGuards(AdminPinGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Kategorie löschen (Admin)' })
  @ApiSecurity('AdminPin')
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Kategorie gelöscht' })
  @ApiNotFoundResponse({ description: 'Kategorie nicht gefunden' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
