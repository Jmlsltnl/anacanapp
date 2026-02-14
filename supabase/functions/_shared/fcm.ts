// Shared FCM v1 helper - generates OAuth2 token from service account
export async function getFirebaseAccessToken(serviceAccountJson: string): Promise<{ accessToken: string; projectId: string }> {
  const serviceAccount = JSON.parse(serviceAccountJson);

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: any) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const unsignedToken = `${encode(header)}.${encode(payload)}`;

  const pemContents = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');

  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signedToken = `${unsignedToken}.${btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${signedToken}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`OAuth token error: ${JSON.stringify(tokenData)}`);
  }

  return { accessToken: tokenData.access_token, projectId: serviceAccount.project_id };
}

export async function sendFCMv1(
  accessToken: string,
  projectId: string,
  deviceToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: boolean; error?: string; unregistered?: boolean }> {
  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const message: any = {
    token: deviceToken,
    notification: { title, body },
    data: data || {},
    android: {
      priority: 'HIGH',
      notification: { sound: 'default', channel_id: 'high_importance_channel' },
    },
    apns: {
      headers: { 'apns-priority': '10', 'apns-push-type': 'alert' },
      payload: {
        aps: {
          alert: { title, body },
          sound: 'default',
          badge: 1,
          'content-available': 1,
          'mutable-content': 1,
        },
      },
    },
  };

  const res = await fetch(fcmUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (res.ok) {
    return { success: true };
  }

  const errBody = await res.json().catch(() => ({}));
  const errCode = errBody?.error?.details?.[0]?.errorCode || errBody?.error?.status || '';
  const unregistered = errCode === 'UNREGISTERED' || errCode === 'INVALID_ARGUMENT';

  return { success: false, error: JSON.stringify(errBody), unregistered };
}
