import { getIronSession } from 'iron-session';
import type { IronSession } from 'iron-session';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { NextResponse, NextRequest } from 'next/server';

interface UserData {
  id: string;
  username: string;
}

export interface SessionData {
  user?: UserData;
  isLoggedIn?: boolean;
}

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is not set');
}

export const sessionOptions = {
  cookieName: "utakara_session",
  password: process.env.SESSION_SECRET,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
  },
};

export async function getSession(req: NextRequest, cookies?: ReadonlyRequestCookies) {
  const res = new NextResponse();
  // Convert NextRequest to Request for iron-session compatibility
  const request = cookies ? new Request(req.url, {
    headers: new Headers({ cookie: cookies.toString() })
  }) : req;
  
  const session = await getIronSession<SessionData>(request, res, sessionOptions);
  
  if (!session.isLoggedIn) {
    session.isLoggedIn = false;
  }

  return session;
}

export async function updateSession(req: NextRequest, res: NextResponse, data: Partial<SessionData>) {
  const session = await getIronSession<SessionData>(new Request(req.url, {
    headers: req.headers
  }), res, sessionOptions);
  Object.assign(session, data);
  await session.save();
  return session;
}