import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostgresModule } from './postgres/postgres.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OldSession } from './models/oldSession';
import { ActiveSession } from './models/activeSession';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskServieModule } from './task-servie/task-servie.module';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [PostgresModule, TypeOrmModule.forFeature([OldSession, ActiveSession]), ScheduleModule.forRoot(), TaskServieModule, LoggerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private dataSource: DataSource){}
}
