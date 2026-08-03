import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import { getAppUrl } from "./auth-utils";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : getAppUrl(),
  plugins: [emailOTPClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  forgetPassword,
  resetPassword,
} = authClient;
