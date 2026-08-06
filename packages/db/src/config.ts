export const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const DATABASE_URL = IS_PRODUCTION
  ? process.env.NEON_DATABASE_URL!
  : process.env.DATABASE_URL!;
