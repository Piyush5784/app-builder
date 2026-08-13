import { BACKEND_URL } from "@/config";
import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: `${BACKEND_URL}/api/v1/auth`,
  plugins: [magicLinkClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  changePassword,
  requestPasswordReset,
  resetPassword,
  deleteUser,
  listAccounts,
  linkSocial,
  unlinkAccount,
} = authClient;
