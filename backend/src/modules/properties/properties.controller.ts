import * as fs from 'fs';
import * as path from 'path';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/types/auth-user';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyFilterDto } from './dto/property-filter.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertiesService } from './properties.service';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { diskStorage } = require('multer');

const UPLOADS_DIR = path.resolve(__dirname, '..', '..', '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

@Controller()
export class PropertiesController {
  constructor(private readonly service: PropertiesService) {}

  @Get('properties')
  findCatalog(@Query() filter: PropertyFilterDto) {
    return this.service.findCatalog(filter);
  }

  @Get('properties/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get('landlord/properties')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD')
  findMine(@CurrentUser() user: AuthUser) {
    return this.service.findByOwner(user.id);
  }

  @Post('properties')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePropertyDto) {
    return this.service.create(user.id, dto);
  }

  @Post('properties/:id/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req: any, _file: any, cb: (error: Error | null, destination: string) => void) => {
          if (!fs.existsSync(UPLOADS_DIR)) {
            fs.mkdirSync(UPLOADS_DIR, { recursive: true });
          }
          cb(null, UPLOADS_DIR);
        },
        filename: (req: any, file: any, cb: (error: Error | null, filename: string) => void) => {
          const rawExt = path.extname(file.originalname || '').toLowerCase();
          const ext = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : '.jpg';
          const safeId = String(req.params?.id ?? 'prop').replace(/[^0-9a-zA-Z_-]/g, '');
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `property-${safeId}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype || !file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Разрешена загрузка только изображений (image/*)'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @UploadedFile() file?: { filename: string; mimetype: string; size: number },
  ) {
    if (!file || !file.filename) {
      throw new BadRequestException('Файл изображения не передан (ожидается поле file)');
    }
    const imageUrl = `/uploads/${file.filename}`;
    return this.service.updateImage(id, user.id, imageUrl);
  }

  @Put('properties/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD')
  replace(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser, @Body() dto: UpdatePropertyDto) {
    return this.service.update(id, user.id, dto);
  }

  @Patch('properties/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD')
  update(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser, @Body() dto: UpdatePropertyDto) {
    return this.service.update(id, user.id, dto);
  }

  @Delete('properties/:id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.service.remove(id, user.id);
  }

  @Patch('properties/:id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD')
  deactivate(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.service.deactivate(id, user.id);
  }

  @Patch('properties/:id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD')
  activate(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.service.activate(id, user.id);
  }
}
