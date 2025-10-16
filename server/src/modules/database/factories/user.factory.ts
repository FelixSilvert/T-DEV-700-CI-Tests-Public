import { CreateUserDto } from "../../users/dto/create-user.dto";
import { UserRole } from "../../users/entities/user.entity";
import { randomInt } from "../utils/time.utils";

const FIRST_NAMES = [
  "Alice",
  "Martin",
  "Clara",
  "Thomas",
  "Sophie",
  "Lucas",
  "Emma",
  "Noah",
  "Julie",
  "Louis",
  "Elise",
  "Nathan",
  "Camille",
  "Julien",
  "Sarah",
  "Hugo",
  "Lea",
  "Paul",
  "Manon",
  "Victor",
];

const LAST_NAMES = [
  "Durand",
  "Lefevre",
  "Martin",
  "Petit",
  "Robert",
  "Richard",
  "Moreau",
  "Simon",
  "Laurent",
  "Michel",
  "Garcia",
  "David",
  "Bertrand",
  "Roux",
  "Vincent",
  "Fournier",
  "Lopez",
  "Fontaine",
  "Chevalier",
  "Renard",
];

const WORKING_PROFILES = [
  { arrival: "08:30", departure: "17:00", lunch: 60 },
  { arrival: "09:00", departure: "17:30", lunch: 45 },
  { arrival: "08:45", departure: "17:15", lunch: 60 },
  { arrival: "09:30", departure: "18:00", lunch: 60 },
  { arrival: "08:15", departure: "16:45", lunch: 45 },
  { arrival: "10:00", departure: "18:30", lunch: 60 },
];

export interface BuildUserOptions {
  role?: UserRole;
  teamId?: string | null;
}

export class UserFactory {
  private emailCounter = 1;
  private phoneCounter = 10_000_000;
  private passwordCounter = 200;

  constructor(private readonly emailDomain = "seed.example.com") {}

  create(options: BuildUserOptions = {}): CreateUserDto {
    const profile = WORKING_PROFILES[randomInt(0, WORKING_PROFILES.length - 1)];
    const firstName = FIRST_NAMES[randomInt(0, FIRST_NAMES.length - 1)];
    const lastName = LAST_NAMES[randomInt(0, LAST_NAMES.length - 1)];

    return {
      firstName,
      lastName,
      email: this.buildEmail(firstName, lastName),
      phoneNumber: this.buildPhone(),
      password: this.buildPassword(),
      role: options.role,
      IDTeam: options.teamId ?? undefined,
      expectedArrivalTime: profile.arrival,
      expectedDepartureTime: profile.departure,
      lunchBreakDuration: profile.lunch,
    };
  }

  private buildEmail(firstName: string, lastName: string): string {
    const normalizedFirst = firstName.normalize("NFD").replace(/[^A-Za-z]/g, "");
    const normalizedLast = lastName.normalize("NFD").replace(/[^A-Za-z]/g, "");
    const slug = `${normalizedFirst}.${normalizedLast}`.toLowerCase();
    const suffix = String(this.emailCounter++).padStart(2, "0");
    return `${slug}.${suffix}@${this.emailDomain}`;
  }

  private buildPhone(): string {
    const suffix = String(this.phoneCounter++).padStart(8, "0");
    return `+336${suffix}`;
  }

  private buildPassword(): string {
    const id = this.passwordCounter++;
    return `Seeding!${id}A`;
  }
}
