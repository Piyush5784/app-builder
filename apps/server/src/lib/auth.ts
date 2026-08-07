import { APIError, betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@package/db";
import { customSession, magicLink } from "better-auth/plugins";
import { sendEmail } from "@/lib/email";
import { createAuthMiddleware } from "better-auth/api";
import z from "zod";

export const passwordSchema = z
  .string()
  .min(1, { message: "Password is required" })
  .min(8, { message: "Password must be at least 8 characters" });
// .regex(/[^A-Za-z0-9]/, {
//   message: "Password must contain at least one special character",
// });

const options = {
  basePath: "/api/v1/auth",

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  socialProviders: {
    google: {
      enabled: true,
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  // Email + password login/registration
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    async sendResetPassword({ user, url }) {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: `Click the link to reset your password: ${url}`,
      });
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        html: `
          <h2>Verify your email</h2>
          <a href="${url}">Verify Email</a>
        `,
      });
    },
    sendOnSignUp: true,
    expiresIn: 60 * 60 * 24, // 24 hours
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (
        ctx.path === "/sign-up/email" ||
        ctx.path === "/reset-password" ||
        ctx.path === "/change-password"
      ) {
        const password = ctx.body.password || ctx.body.newPassword;
        const { error } = passwordSchema.safeParse(password);
        if (error) {
          throw new APIError("BAD_REQUEST", {
            message: "Password not strong enough",
          });
        }
      }
    }),
  },

  user: {
    deleteUser: {
      enabled: true,
    },
    additionalFields: {
      username: {
        type: "string",
        required: false,
        input: true,
      },
      bio: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  trustedOrigins: [process.env.FRONTEND_URL!],
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...options,
  plugins: [
    // passing `options` as the second argument is what makes user.username,
    // user.bio, etc. properly typed inside this callback instead of falling
    // back to the base User type
    customSession(async ({ user, session }) => {
      return {
        session,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
          username: user.username,
          bio: user.bio,
        },
      };
    }, options),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendEmail({
          to: email,
          subject: "Sign in to your account",
          html: `Click the link to sign in: ${url}`,
        });
      },
    }),
  ],
});
