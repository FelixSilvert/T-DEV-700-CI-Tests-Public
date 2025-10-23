import { Test, TestingModule } from "@nestjs/testing";
import { TeamsController } from "./teams.controller";
import { TeamsService } from "./teams.service";

describe("TeamsController", () => {
  let controller: TeamsController;

  beforeEach(async () => {
    const mockTeamsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [
        {
          provide: TeamsService,
          useValue: mockTeamsService,
        },
      ],
    }).compile();

    controller = module.get<TeamsController>(TeamsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
