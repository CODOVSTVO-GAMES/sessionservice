import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostgresModule } from './postgres/postgres.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OldSession } from './models/oldSession';
import { ActiveSession } from './models/activeSession';

@Module({
  imports: [PostgresModule, TypeOrmModule.forFeature([OldSession, ActiveSession])],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private dataSource: DataSource){}
}
