import { Module } from '@nestjs/common';
import { TaskServieService } from './task-servie.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActiveSession } from 'src/models/activeSession';
import { OldSession } from 'src/models/oldSession';

@Module({
  providers: [TaskServieService],
  imports: [TypeOrmModule.forFeature([OldSession, ActiveSession])]
})
export class TaskServieModule {}
