import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";

export interface JWTPayload {
  id: string;
  email: string;
  jti: string; // JWT ID for blacklisting
}

export const generateJWT = (payload: { id: string; email: string }) => {
  const jti = randomBytes(16).toString("hex");

  return jwt.sign({ ...payload, jti }, process.env.JWT_KEY!, {
    expiresIn: "15m",
  });
};

export const verifyJWT = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_KEY!) as JWTPayload;
};
