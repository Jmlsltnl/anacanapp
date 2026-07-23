// Native OAuth (iOS/Android) via Firebase Auth + Apple Sign-In plugins.
// Returns Supabase-compatible tokens (idToken + optional nonce) that we exchange
// via supabase.auth.signInWithIdToken().

import { supabase } from "@/integrations/supabase/client";

export const isNative = (): boolean => {
  const cap = (window as any)?.Capacitor;
  return typeof cap?.isNativePlatform === "function" && cap.isNativePlatform();
};

/**
 * Native Google Sign-In using @capacitor-firebase/authentication.
 * Works on both iOS and Android — Firebase handles the platform bits.
 */
export async function signInWithGoogleNative() {
  const { FirebaseAuthentication } = await import(
    "@capacitor-firebase/authentication"
  );

  // Sign out of any prior Firebase session so account picker shows every time.
  try {
    await FirebaseAuthentication.signOut();
  } catch {}

  const result = await FirebaseAuthentication.signInWithGoogle();
  const idToken = result?.credential?.idToken;
  if (!idToken) {
    throw new Error("Google Sign-In returned no idToken");
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
  });
  if (error) throw error;
  return data;
}

/**
 * Native Apple Sign-In (iOS only).
 * Uses @capacitor-community/apple-sign-in for a native flow — no browser popup.
 */
export async function signInWithAppleNative() {
  const platform = (window as any)?.Capacitor?.getPlatform?.();
  if (platform !== "ios") {
    throw new Error("Apple Sign-In native flow is iOS-only");
  }

  const { SignInWithApple } = await import(
    "@capacitor-community/apple-sign-in"
  );

  // A random nonce, hashed with SHA-256 for Apple, raw sent to Supabase.
  const rawNonce = generateNonce();
  const hashedNonce = await sha256Hex(rawNonce);

  const res = await SignInWithApple.authorize({
    scopes: "email name",
    state: "signin",
    nonce: hashedNonce,
  });

  const idToken = res?.response?.identityToken;
  if (!idToken) throw new Error("Apple Sign-In returned no identityToken");

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: idToken,
    nonce: rawNonce,
  });
  if (error) throw error;
  return data;
}

function generateNonce(length = 32): string {
  const charset =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => charset[b % charset.length]).join("");
}

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
