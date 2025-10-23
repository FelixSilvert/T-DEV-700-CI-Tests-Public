import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { HttpException } from "@nestjs/common";
import { TeamsService } from "./teams.service";
import { Team } from "./entities/team.entity";
import { CreateTeamDto } from "./dto/create-team.dto";
import { UpdateTeamDto } from "./dto/update-team.dto";

describe("TeamsService", () => {
  let service: TeamsService;
  let teamRepository: jest.Mocked<Repository<Team>>;

  const mockTeam: Partial<Team> = {
    id: "team-1",
    name: "Development Team",
    description: "Main development team",
    managerId: "user-1",
  };

  beforeEach(async () => {
    const mockTeamRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        {
          provide: getRepositoryToken(Team),
          useValue: mockTeamRepository,
        },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
    teamRepository = module.get(getRepositoryToken(Team));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    const createTeamDto: CreateTeamDto = {
      name: "New Team",
      description: "A new team",
      managerId: "user-1",
    };

    it("should create a team successfully", async () => {
      teamRepository.create.mockReturnValue(mockTeam as Team);
      teamRepository.save.mockResolvedValue(mockTeam as Team);

      const result = await service.create(createTeamDto);

      expect(teamRepository.create).toHaveBeenCalledWith(createTeamDto);
      expect(teamRepository.save).toHaveBeenCalled();
      expect(result.message).toBe("Team created");
    });

    it("should handle errors during team creation", async () => {
      teamRepository.create.mockReturnValue(mockTeam as Team);
      teamRepository.save.mockRejectedValue(new Error("Database error"));

      await expect(service.create(createTeamDto)).rejects.toThrow(HttpException);
    });
  });

  describe("findAll", () => {
    it("should return paginated list of teams", async () => {
      const teams = [mockTeam as Team];
      teamRepository.findAndCount.mockResolvedValue([teams, 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(teamRepository.findAndCount).toHaveBeenCalled();
      expect(result.data).toEqual(teams);
      expect(result.meta.totalItems).toBe(1);
    });

    it("should filter teams by search term", async () => {
      const teams = [mockTeam as Team];
      teamRepository.findAndCount.mockResolvedValue([teams, 1]);

      const result = await service.findAll({ page: 1, limit: 10, search: "Development" });

      expect(teamRepository.findAndCount).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
    });
  });

  describe("findOne", () => {
    it("should return a team by id", async () => {
      teamRepository.findOne.mockResolvedValue(mockTeam as Team);

      const result = await service.findOne("team-1");

      expect(teamRepository.findOne).toHaveBeenCalledWith({ where: { id: "team-1" } });
      expect(result).toEqual(mockTeam);
    });

    it("should throw HttpException if team not found", async () => {
      teamRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne("invalid-id")).rejects.toThrow(HttpException);
    });
  });

  describe("update", () => {
    const updateTeamDto: UpdateTeamDto = {
      name: "Updated Team Name",
      description: "Updated description",
    };

    it("should update a team successfully", async () => {
      const updatedTeam = { ...mockTeam, ...updateTeamDto };
      teamRepository.findOne.mockResolvedValue(mockTeam as Team);
      teamRepository.save.mockResolvedValue(updatedTeam as Team);

      const result = await service.update("team-1", updateTeamDto);

      expect(teamRepository.findOne).toHaveBeenCalledWith({ where: { id: "team-1" } });
      expect(teamRepository.save).toHaveBeenCalled();
      expect(result.message).toBe("Team updated successfully");
    });

    it("should throw HttpException if team not found", async () => {
      teamRepository.findOne.mockResolvedValue(null);

      await expect(service.update("invalid-id", updateTeamDto)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe("delete", () => {
    it("should delete a team successfully", async () => {
      teamRepository.findOne.mockResolvedValue(mockTeam as Team);
      teamRepository.delete.mockResolvedValue({ affected: 1, raw: [] } as any);

      const result = await service.delete("team-1");

      expect(teamRepository.findOne).toHaveBeenCalledWith({ where: { id: "team-1" } });
      expect(teamRepository.delete).toHaveBeenCalledWith("team-1");
      expect(result.message).toBe("Team deleted successfully");
    });

    it("should throw HttpException if team not found", async () => {
      teamRepository.findOne.mockResolvedValue(null);

      await expect(service.delete("invalid-id")).rejects.toThrow(HttpException);
    });
  });
});
