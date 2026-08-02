export type UserPayload = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null;

  username?: string | null;
  bio?: string | null;
  isPrivate: boolean;

  followersCount: number;
  followingCount: number;
  postsCount: number;
};

export type UserSession = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  expiresAt: Date;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};
