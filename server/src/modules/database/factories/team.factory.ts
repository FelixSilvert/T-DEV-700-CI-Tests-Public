import { Team } from "../../teams/entities/team.entity";

const TEAM_TEMPLATES: Array<Pick<Team, "name" | "description">> = [
  { name: "Atlas Product", description: "Product specialists delivering new customer features." },
  { name: "Nova Platform", description: "Platform engineers scaling the core services." },
  { name: "Orion Support", description: "Client success experts supporting daily operations." },
  { name: "Helios Data", description: "Data analysts curating actionable insights for teams." },
  { name: "Zephyr Growth", description: "Growth unit experimenting with acquisition strategies." },
  { name: "Aurora Design", description: "Design studio shaping interfaces and user journeys." },
];

export class TeamFactory {
  private templateIndex = 0;
  private readonly usedNames = new Set<string>();

  create(managerId: string): Pick<Team, "name" | "description" | "managerId"> {
    const template = this.nextTemplate();
    return {
      managerId,
      name: template.name,
      description: template.description,
    };
  }

  private nextTemplate(): Pick<Team, "name" | "description"> {
    const template = TEAM_TEMPLATES[this.templateIndex % TEAM_TEMPLATES.length];
    this.templateIndex += 1;

    if (!this.usedNames.has(template.name)) {
      this.usedNames.add(template.name);
      return template;
    }

    let counter = 2;
    let candidate = `${template.name} ${counter}`;
    while (this.usedNames.has(candidate)) {
      counter += 1;
      candidate = `${template.name} ${counter}`;
    }

    this.usedNames.add(candidate);
    return {
      name: candidate,
      description: template.description,
    };
  }
}
