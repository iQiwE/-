import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { AuthModule } from './modules/auth/auth.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { DictionariesModule } from './modules/dictionaries/dictionaries.module';
import { PropertiesModule } from './modules/properties/properties.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({
        secret: c.get<string>('jwt.secret'),
        signOptions: { expiresIn: c.get<string>('jwt.expiresIn') as any },
      }),
    }),
    DatabaseModule,
    AuthModule,
    PropertiesModule,
    ApplicationsModule,
    ContractsModule,
    DictionariesModule,
  ],
})
export class AppModule {}
