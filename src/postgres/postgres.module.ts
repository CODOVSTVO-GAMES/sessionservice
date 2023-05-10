import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActiveSession } from 'src/models/activeSession';
import { OldSession } from 'src/models/oldSession';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'psqldb',
      port: 5432,
      username: 'keshox',
      password: 'example',
      database: 'sessiondb',
      entities: [OldSession, ActiveSession],
      synchronize: true,
      autoLoadEntities: true,
    }),
  ],
})
export class PostgresModule {}
