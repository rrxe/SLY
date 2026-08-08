import React, { useEffect, useState } from "react";

interface UserData {
  telegramId: string;
  referralsCount: number;
}

export default function Referrals() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const initData = tg?.initData || "";

    fetch("/api/auth/me", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `tga ${initData}`,
      },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));

        if (!res.ok || data.error) {
          throw new Error(data.error || `Request failed (${res.status})`);
        }

        setUser({
          telegramId: String(data.telegramId || ""),
          referralsCount: Number(data.referralsCount || 0),
        });
      })
      .catch((err) => {
        console.error("Referrals load error:", err);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const botUsername = "SLYmint_bot";
  const referralLink = user?.telegramId
    ? `https://t.me/${botUsername}?start=ref_${user.telegramId}`
    : "";

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      style={{
        padding: "6px 0",
        color: "#eaf3ff",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          padding: 18,
          borderRadius: 24,
          background: "rgba(15,23,40,.76)",
          border: "1px solid rgba(255,255,255,.06)",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 28 }}>Referrals</h2>
        <p style={{ marginTop: 8, color: "#92a1b7", lineHeight: 1.6 }}>
          Referral rewards, 500 coins first bonus, and extra bonuses for invited users.
        </p>

        {loading ? (
          <p style={{ color: "#92a1b7", marginTop: 20 }}>Loading...</p>
        ) : (
          <div style={{ marginTop: 20 }}>
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                padding: 14,
                borderRadius: 16,
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 14, color: "#92a1b7" }}>
                Total Referrals
              </span>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  marginTop: 4,
                  color: "#40a7e3",
                }}
              >
                {user?.referralsCount || 0}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 13,
                  color: "#92a1b7",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Your Referral Link
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  placeholder={user ? "" : "Referral link unavailable"}
                  style={{
                    flex: 1,
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    padding: "10px 14px",
                    color: "#fff",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
                <button
                  onClick={handleCopy}
                  disabled={!referralLink}
                  style={{
                    background: !referralLink
                      ? "rgba(64,167,227,0.35)"
                      : copied
                      ? "#4caf50"
                      : "#40a7e3",
                    color: "#fff",
                    border: "none",
                    borderRadius: 12,
                    padding: "0 18px",
                    fontWeight: "bold",
                    cursor: !referralLink ? "not-allowed" : "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
