import { auth } from "@/lib/auth";

export class SessionService {
  static async getSession(headers: Headers) {
    try {
      const session = await auth.api.getSession({
        headers,
      });
      if (!session) {
        return { isValid: false, isExpired: false, session: null };
      }
      
      // Defensive check for session expiration date
      const expiresAt = new Date(session.session.expiresAt);
      if (expiresAt.getTime() < Date.now()) {
        return { isValid: false, isExpired: true, session: null };
      }

      return { isValid: true, isExpired: false, session };
    } catch (error: any) {
      console.error("SessionService error:", error);
      return { isValid: false, isExpired: false, session: null, error: error.message };
    }
  }
}
