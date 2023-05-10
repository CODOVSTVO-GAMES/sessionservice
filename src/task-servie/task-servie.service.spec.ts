import { Test, TestingModule } from '@nestjs/testing';
import { TaskServieService } from './task-servie.service';

describe('TaskServieService', () => {
  let service: TaskServieService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaskServieService],
    }).compile();

    service = module.get<TaskServieService>(TaskServieService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
