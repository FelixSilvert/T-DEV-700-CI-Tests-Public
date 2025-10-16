import { Logger } from "@nestjs/common";
import { Repository } from "typeorm";
import { UsersService } from "../../users/users.service";
import { User, UserRole } from "../../users/entities/user.entity";
import { Team } from "../../teams/entities/team.entity";
import { Clock } from "../../clocks/entities/clock.entity";
import { SafeUser } from "../../users/types/user.types";
import { UserFactory } from "../factories/user.factory";
import { TeamFactory } from "../factories/team.factory";
import { ClockFactory, ClockProfile } from "../factories/clock.factory";
import { generateRecentWorkdays } from "../utils/time.utils";
import { AdminSeedService } from "../services/admin-seed.service";

interface SeedTeamResult {
  managers: SafeUser[];
  members: SafeUser[];
  teams: Team[];
}

export class DatabaseSeeder {
  private readonly userFactory = new UserFactory("workspace.trinity.dev");
  private readonly teamFactory = new TeamFactory();
  private readonly clockFactory = new ClockFactory();
  private readonly adminSeeder: AdminSeedService;

  constructor(
    private readonly usersService: UsersService,
    private readonly userRepository: Repository<User>,
    private readonly teamRepository: Repository<Team>,
    private readonly clockRepository: Repository<Clock>,
    private readonly logger: Logger,
  ) {
    this.adminSeeder = new AdminSeedService(usersService, userRepository, logger);
  }

  async run(): Promise<void> {
    this.logger.log("Resetting dataset (users, teams, clocks)...");
    this.ensureResetAllowed();
    await this.resetDatabase();

    this.logger.log("Seeding admin user");
  const admin = await this.adminSeeder.ensureAdmin();

    this.logger.log("Building teams, managers, and members");
    const { managers, members, teams } = await this.seedTeamsAndMembers();

    this.logger.log("Generating activity clocks");
    await this.seedClocks([admin, ...managers, ...members]);

    this.logger.log(`Seed completed: ${teams.length} teams, ${managers.length} managers, ${members.length} members, plus admin.`);
  }

  private async resetDatabase(): Promise<void> {
    await this.clockRepository.createQueryBuilder().delete().execute();
    await this.userRepository.createQueryBuilder().delete().execute();
    await this.teamRepository.createQueryBuilder().delete().execute();
  }

  private ensureResetAllowed(): void {
    const environment = process.env.NODE_ENV ?? "development";

    if (environment === "production") {
      throw new Error(
        "Global seeder aborted: refusing to reset database while NODE_ENV=production. Set ALLOW_DATA_RESET=true only if you explicitly want to wipe production data.",
      );
    } else {
      this.logger.warn(
        `ALLOW_DATA_RESET=true detected; continuing with full dataset reset (NODE_ENV=${environment}).`,
      );
    }
  }

  private async seedTeamsAndMembers(): Promise<SeedTeamResult> {
    const managers: SafeUser[] = [];
    const members: SafeUser[] = [];
    const teams: Team[] = [];

    const teamCount = 4;

    for (let index = 0; index < teamCount; index += 1) {
      const managerDto = this.userFactory.create({ role: UserRole.MANAGER });
      const managerResult = await this.usersService.create(managerDto, undefined, { allowPrivilegedRole: true });
      const manager = managerResult.user;

      const teamPayload = this.teamFactory.create(manager.id);
      const team = await this.teamRepository.save(this.teamRepository.create(teamPayload));

      await this.userRepository.update(manager.id, { IDTeam: team.id });
      manager.IDTeam = team.id;

      managers.push(manager);
      teams.push(team);

      const memberCount = this.randomWithin(6, 10);
      for (let memberIndex = 0; memberIndex < memberCount; memberIndex += 1) {
        const memberDto = this.userFactory.create({ teamId: team.id });
        const memberResult = await this.usersService.create(memberDto, undefined, { allowPrivilegedRole: true });
        members.push(memberResult.user);
      }
    }

    return { managers, members, teams };
  }

  private async seedClocks(users: SafeUser[]): Promise<void> {
    const workdays = generateRecentWorkdays(25, { includeToday: false });
    const profiles = users.map((user) => this.toClockProfile(user));

    const seeds = profiles.flatMap((profile) => this.clockFactory.generate(profile, workdays));

    if (seeds.length === 0) {
      this.logger.warn("No clocks produced; skipping clock persistence.");
      return;
    }

    const clocks = this.clockRepository.create(seeds);
    await this.clockRepository.save(clocks);
    this.logger.log(`Persisted ${clocks.length} clock events across ${profiles.length} users.`);
  }

  private toClockProfile(user: SafeUser): ClockProfile {
    return {
      id: user.id,
      expectedArrivalTime: user.expectedArrivalTime,
      expectedDepartureTime: user.expectedDepartureTime,
      lunchBreakDuration: user.lunchBreakDuration,
    };
  }

  private randomWithin(min: number, max: number): number {
    const low = Math.ceil(min);
    const high = Math.floor(max);
    return Math.floor(Math.random() * (high - low + 1)) + low;
  }
}
