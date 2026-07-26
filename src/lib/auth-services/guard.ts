import { Role } from "@prisma/client";
import { CookieService } from "./cookie.service";
import { SessionService } from "./session.service";
import { RoleService } from "./role.service";
import { AuthResult } from "./types";

export async function validateSessionAndRole(
  headers: Headers,
  requiredRole?: Role
): Promise<AuthResult> {
  // 1. Check for cookie existence
  const hasCookie = await CookieService.hasSessionCookie();
  if (!hasCookie) {
    return { state: "NO_COOKIE" };
  }

  // 2. Fetch session from Better Auth database
  const sessionResult = await SessionService.getSession(headers);
  if (sessionResult.error) {
    return { state: "UNAVAILABLE", error: sessionResult.error };
  }

  if (sessionResult.isExpired) {
    return { state: "EXPIRED_SESSION" };
  }

  if (!sessionResult.isValid || !sessionResult.session) {
    return { state: "INVALID_SESSION" };
  }

  const session = sessionResult.session;

  // 3. Fetch user profile from Database
  const profile = await RoleService.getUserProfile(session.user.id);
  if (!profile) {
    return { state: "INVALID_SESSION", session };
  }

  // 4. Verify Role Authorization
  const hasPermission = RoleService.verifyRole(profile.role, requiredRole);
  if (!hasPermission) {
    return { state: "ROLE_MISMATCH", session, userProfile: profile };
  }

  return { state: "AUTHORIZED", session, userProfile: profile };
}
