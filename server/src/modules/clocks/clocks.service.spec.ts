import { Test, TestingModule } from '@nestjs/testing';
import { ClocksService } from './clocks.service';

describe('ClocksService', () => {
  let service: ClocksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClocksService],
    }).compile();

    service = module.get<ClocksService>(ClocksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
