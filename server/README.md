# Mapee-Server

```bash
npm install
```

## Commandes

### générer un nouveau module à l'aide du CLI Nest

1. Taper la commande suivante dans le terminale à la racine du backend

```bash
nest g resource modules/[ressource_name]
```

> ⚠⚠⚠ Le nom de la ressource doit être au pluriel 2. Selectionner "REST API" 3.
> Taper `y` pour accepter la génération des routes de base et
> de tous les fichies 4.
> La ressource generé se trouvera dans le dossier modules 5.
> Modifier les fichiers generé

## 🏃Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## 🧪 Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## 🌳 Architecture

<!-- markdownlint-disable line-length -->

```lang-none
.
└── serveur/
    ├── src/                                    # 🚪 Point d'entrée
    │   ├── guards/                             # 🔒 Contient les différents guards custom de l'app
    │   ├── modules/                            # 📦 Contient les différents modules de l'app
    │   │   ├── database/                       # 📦 Module pour la gestion de la BDD
    │   │   │   └── database.module.ts
    │   │   ├── users/                          # 📦 Module pour la gestion des utilisateurs
    │   │   │   ├── dto/                        # 📝 Data Transfer Objects pour les utilisateurs
    │   │   │   │   ├── create-user.dto.ts
    │   │   │   │   └── update-user.dto.ts
    │   │   │   ├── entities/                   # 🗂 Entités pour les utilisateurs
    │   │   │   │   └── user.entity.ts
    │   │   │   ├── user.controller.ts
    │   │   │   ├── user.module.ts
    │   │   │   ├── user.service.spec.ts
    │   │   │   └── user.service.ts
    │   │   └── other/                          # 📦 Module pour d'autre fonctionnalités
    │   │       ├── dto/
    │   │       │   ├── create-other.dto.ts
    │   │       │   └── update-other.dto.ts
    │   │       ├── entities/
    │   │       │   └── other.entity.ts
    │   │       ├── other.controller.ts
    │   │       ├── other.module.ts
    │   │       ├── other.service.spec.ts
    │   │       └── other.service.ts
    │   ├── app.controller.ts                   # 🎮 Contrôleur principal de l'application
    │   ├── app.module.ts                       # 📦 Module principal de l'application
    │   ├── app.service.ts                      # ⚒️ Service principal de l'application
    │   └── main.ts                             # 🏠 Point d'entrée principal de l'application serveur
    ├── package.json
    ├── tsconfig.json
    ├── nest-cli.json
    └── .prettierrc
```

<!-- markdownlint-restore -->

## 📄 Conventions

### Entity

```typescript
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", unique: true })
  email: string;

  @Column()
  password: string;
}
```

### DTO (Data Transfer Objects)

```typescript
export class CreateUserDto {
  @ApiProperty({
    example: 'john-doe@gmail.com',
    required: true,
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

    @ApiProperty({
    example: 'P@ssword123',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  password: string;
```

### Modules

```typescript
@Module({
  imports: [],
  controllers: [UserController],
  providers: [UserService],
  exports: [],
})
export class UserModule {}
```

### Services

```typescript
import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../users/entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly UserRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const userExist = await this.UserRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (userExist) {
        throw new HttpException(
          "User with this email already exist",
          HttpStatus.BAD_REQUEST,
        );
      }

      const newUser = this.UserRepository.create({
        ...createUserDto,
        password: hashedPassword,
      });

      await this.UserRepository.save(newUser);

      return {
        message: "Account created successfully",
      };
    } catch (error) {
      this.logger.log("error : ", error);

      throw new HttpException(
        error.message || "An error occurred",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
```

### Controlleur

```typescript
@ApiTags("User")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post("add")
  @ApiOperation({
    summary: "Route not protected by guards",
    description: "Inscription d'un utilisateur",
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
```
