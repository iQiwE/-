import { Module } from '@nestjs/common';
import { PropertiesModule } from '../properties/properties.module';
import { DictionariesController } from './dictionaries.controller';

@Module({ imports: [PropertiesModule], controllers: [DictionariesController] })
export class DictionariesModule {}

