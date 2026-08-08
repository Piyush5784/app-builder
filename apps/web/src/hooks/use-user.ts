import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { useEffect } from "react";

import {
  signIn,
  signUp,
  signOut,
  changePassword,
  requestPasswordReset,
  resetPassword,
  deleteUser,
} from "@/lib/auth-client";
import { FRONTEND_URL } from "@/config";

type BaseUser = NonNullable<ReturnType<typeof useSession>["data"]>["user"];

export type SessionUser = BaseUser & {
  username?: string | null;
  bio?: string | null;
  credits: number;
};

// =====================
// Login Mutation
// =====================

export function useLogin() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await signIn.email({
        email: credentials.email,
        password: credentials.password,
        callbackURL: `${FRONTEND_URL}/dashboard`,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response;
    },

    onSuccess: () => {
      toast.success("Logged in!", {
        description: "User successfully logged in",
      });

      navigate({
        to: "/dashboard",
      });
    },

    onError: (error) => {
      toast.error("Login failed", {
        description: error.message,
      });
    },
  });
}

// =====================
// Register Mutation
// =====================

export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      name: string;
    }) => {
      const response = await signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
        callbackURL: `${FRONTEND_URL}/dashboard`,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response;
    },

    onSuccess: () => {
      toast.success("Account created!", {
        description: "Welcome!",
      });

      navigate({
        to: "/auth/Login",
      });
    },

    onError: (error) => {
      toast.error("Registration failed", {
        description: error.message,
      });
    },
  });
}

// =====================
// Change password Mutation
// =====================

export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const response = await changePassword(input);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response;
    },

    onSuccess: () => {
      toast.success("Password changed");
    },

    onError: (error) => {
      toast.error("Could not change password", {
        description: error.message,
      });
    },
  });
}

// =====================
// Request password reset Mutation
// =====================

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await requestPasswordReset({
        email,
        redirectTo: `${FRONTEND_URL}/auth/reset-password`,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response;
    },

    onError: (error) => {
      toast.error("Could not send reset email", {
        description: error.message,
      });
    },
  });
}

// =====================
// Reset password Mutation
// =====================

export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (input: { newPassword: string; token: string }) => {
      const response = await resetPassword(input);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response;
    },

    onSuccess: () => {
      toast.success("Password reset — you can now log in");
      navigate({ to: "/auth/Login" });
    },

    onError: (error) => {
      toast.error("Could not reset password", {
        description: error.message,
      });
    },
  });
}

// =====================
// Magic link sign-in Mutation
// =====================

export function useMagicLinkSignIn() {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await signIn.magicLink({
        email,
        callbackURL: `${FRONTEND_URL}/dashboard`,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response;
    },

    onError: (error) => {
      toast.error("Could not send sign-in link", {
        description: error.message,
      });
    },
  });
}

// =====================
// Delete account Mutation
// =====================

export function useDeleteAccount() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (password: string) => {
      const response = await deleteUser({ password });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response;
    },

    onSuccess: async () => {
      toast.success("Account deleted");
      await signOut();
      navigate({ to: "/" });
    },

    onError: (error) => {
      toast.error("Could not delete account", {
        description: error.message,
      });
    },
  });
}

// =====================
// Logout Mutation
// =====================

export function useUser() {
  const { isPending, data } = useSession();

  const navigate = useNavigate();

  useEffect(() => {
    if (!isPending && !data?.user) {
      // navigate({
      //   to: "/auth/Login",
      // });
    }
  }, [isPending, data?.user, navigate]);

  return {
    isAuthenticated: !!data?.user,
    isLoading: isPending,
    data: data ? { ...data, user: data.user as SessionUser } : null,
  };
}
