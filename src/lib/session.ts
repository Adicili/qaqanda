// src/lib/session.ts
import crypto from 'crypto';

import { ENV } from '@/lib/env';

export const SESSION_COOKIE_NAME = 'qaqanda_session';

export type SessionRole = 'ENGINEER' | 'LEAD';

export type SessionPayload = {
  userId: string;
  role: SessionRole;
};

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(value: string): string {
  const padLength = (4 - (value.length % 4)) % 4;
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLength);

  return Buffer.from(normalized, 'base64').toString('utf8');
}

function sign(body: string): string {
  const hmac = crypto.createHmac('sha256', ENV.SESSION_SECRET);
  hmac.update(body);
  const signature = hmac.digest('base64');

  return signature.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function createSessionToken(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  const body = base64UrlEncode(json);
  const signature = sign(body);

  return `${body}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [body, signature] = parts;
  const expectedSignature = sign(body);

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  const isValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  if (!isValid) return null;

  try {
    const json = base64UrlDecode(body);
    const payload = JSON.parse(json) as SessionPayload;
    return payload;
  } catch {
    return null;
  }
}
