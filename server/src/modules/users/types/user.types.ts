import { User } from "../entities/user.entity";

/**
 * Type pour un utilisateur sans le mot de passe
 */
export type SafeUser = Omit<User, 'password'>;

/**
 * Résultat de création d'utilisateur
 */
export interface CreateUserResult {
  message: string;
  user: SafeUser;
}

/**
 * Résultat de mise à jour d'utilisateur
 */
export interface UpdateUserResult {
  message: string;
  user: SafeUser;
}

/**
 * Résultat générique avec message
 */
export interface MessageResult {
  message: string;
}