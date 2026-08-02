import { auth } from "@/lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { ApiError, asyncHandler } from "@/middleware/error-handler";

export const AuthMiddleware = asyncHandler(async (req, _res, next) => {
  let session;
  try {
    session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
  } catch {
    throw new ApiError(401, "Unauthorized");
  }

  if (!session) {
    throw new ApiError(401, "Unauthorized");
  }

  req.user = session.user;
  req.session = session.session;

  next();
});
