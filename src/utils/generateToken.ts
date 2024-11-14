import jwt from "jsonwebtoken";
export const generateToken = (email: string, user: any) => {
  const token = jwt.sign(
    { email, id: user._id },
    process.env.JWT_KEY as string
  );
  return token;
};
