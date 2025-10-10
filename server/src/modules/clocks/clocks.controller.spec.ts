import { Test, TestingModule } from '@nestjs/testing';
import { ClocksController } from './clocks.controller';
import { ClocksService } from './clocks.service';

describe('ClocksController', () => {
  let controller: ClocksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClocksController],
      providers: [ClocksService],
    }).compile();

    controller = module.get<ClocksController>(ClocksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
