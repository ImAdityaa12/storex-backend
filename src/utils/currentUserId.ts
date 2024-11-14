import jwt from "jsonwebtoken";
export const getCurrentUserId = (token: string) => {
  const cleanToken = token.replace("Bearer ", "");
  const decoded = jwt.verify(
    cleanToken,
    process.env.JWT_KEY as string
  ) as jwt.JwtPayload;
  const userId = decoded.id;
  return userId;
};
