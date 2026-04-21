export interface JwtPayload {
  id: string;
  email: string;
  role: "user" | "admin";
}