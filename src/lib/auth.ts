import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "cha_revelacao_secret_token_session_2026";
const COOKIE_NAME = "admin_session";

export interface AdminPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Assina um novo token JWT
export function signToken(payload: AdminPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// Verifica um token JWT
export function verifyToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminPayload;
  } catch (error) {
    return null;
  }
}

// Obtém a sessão do administrador atual a partir dos cookies
export async function getAdminSession(): Promise<AdminPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    return verifyToken(token);
  } catch (error) {
    return null;
  }
}

// Define o cookie de sessão do administrador
export async function setAdminSession(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 dias em segundos
    path: "/",
  });
}

// Remove o cookie de sessão
export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
