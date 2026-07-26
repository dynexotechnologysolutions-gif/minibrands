import { Role } from "@prisma/client";

export type AuthState =
  | "NO_COOKIE"
  | "VALID_SESSION"
  | "INVALID_SESSION"
  | "EXPIRED_SESSION"
  | "ROLE_MISMATCH"
  | "AUTHORIZED"
  | "UNAVAILABLE";

export interface AuthResult {
  state: AuthState;
  session?: any;
  userProfile?: any;
  error?: string;
}
