import { Test, TestingModule } from "@nestjs/testing";
import { ClocksController } from "./clocks.controller";
import { ClocksService } from "./clocks.service";

describe("ClocksController", () => {
  let controller: ClocksController;

  beforeEach(async () => {
    const mockClocksService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClocksController],
      providers: [
        {
          provide: ClocksService,
          useValue: mockClocksService,
        },
      ],
    }).compile();

    controller = module.get<ClocksController>(ClocksController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
