import { ImageResponse } from "next/og";

export const alt = "Payonix — Fast and easy payments in one app";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Generated OG image (1200x630 PNG) for every locale segment; cascades to all
 * nested routes. Text is intentionally English/brand-only: the bundled OG
 * font does not reliably cover Azerbaijani diacritics (ə, İ) - localized
 * titles/descriptions are carried by the og:title/og:description meta tags
 * instead.
 */
export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#171717",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "#D2FA52",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 700,
              color: "#171717",
            }}
          >
            P
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, color: "#ffffff" }}>
            Payonix
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 66,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.1,
              maxWidth: 900,
            }}
          >
            Fast and easy payments in one app
          </div>
          <div style={{ fontSize: 30, color: "#D2FA52" }}>
            Cards · QR payments · Instant Loan · Salary Advance
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 26, color: "#9ca3af" }}>payonix.com</div>
          <div
            style={{
              fontSize: 22,
              color: "#171717",
              background: "#D2FA52",
              padding: "10px 24px",
              borderRadius: 999,
              fontWeight: 600,
            }}
          >
            Licensed by the Central Bank of Azerbaijan
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
