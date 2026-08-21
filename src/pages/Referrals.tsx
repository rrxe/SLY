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

  const botUsername = "SLYMintX_bot";
  const appShortName = "start";
  const referralLink = user?.telegramId
    ? `https://t.me/${botUsername}/${appShortName}?startapp=ref_${user.telegramId}`
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
        color: "#eaf4f2",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          padding: 18,
          borderRadius: 22,
          background: "#141b1c",
          border: "1px solid rgba(255,255,255,.06)",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 28 }}>Referrals</h2>

        <p
          style={{
            marginTop: 8,
            color: "#8fa19e",
            lineHeight: 1.6,
          }}
        >
          Your referral is accepted after the invited user completes{" "}
          <strong style={{ color: "#eaf4f2" }}>4 tasks</strong>.
          Every successful task completion counts, including repeatable tasks.
          You receive <strong style={{ color: "#54e6d4" }}>0.02 USDT</strong>{" "}
          when the referral is confirmed.
        </p>

        {loading ? (
          <p style={{ color: "#8fa19e", marginTop: 20 }}>
            Loading...
          </p>
        ) : (
          <div style={{ marginTop: 20 }}>
            <div
              style={{
                background: "#1b2324",
                padding: 14,
                borderRadius: 14,
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  color: "#8fa19e",
                }}
              >
                Qualified Referrals
              </span>

              <div
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  marginTop: 4,
                  color: "#54e6d4",
                }}
              >
                {user?.referralsCount || 0}
              </div>
            </div>

            <div
              style={{
                background: "rgba(84,230,212,.06)",
                border: "1px solid rgba(84,230,212,.12)",
                padding: 14,
                borderRadius: 14,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#eaf4f2",
                }}
              >
                Referral requirement
              </div>

              <div
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  color: "#8fa19e",
                  lineHeight: 1.6,
                }}
              >
                The invited user must complete{" "}
                <strong style={{ color: "#54e6d4" }}>4 tasks</strong>{" "}
                before the referral is counted.
              </div>

              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "#72817e",
                  lineHeight: 1.5,
                }}
              >
                Example: 5 normal tasks + 5 ad completions = 4 tasks.
                Repeating an allowed task also counts each successful completion.
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 13,
                  color: "#8fa19e",
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
                  placeholder={
                    user
                      ? ""
                      : "Referral link unavailable"
                  }
                  style={{
                    flex: 1,
                    background: "#101516",
                    border: "1px solid rgba(255,255,255,.08)",
                    borderRadius: 12,
                    padding: "10px 14px",
                    color: "#eaf4f2",
                    fontSize: 13,
                    outline: "none",
                  }}
                />

                <button
                  onClick={handleCopy}
                  disabled={!referralLink}
                  style={{
                    background: !referralLink
                      ? "rgba(84,230,212,0.30)"
                      : "#54e6d4",
                    color: "#06201c",
                    border: "none",
                    borderRadius: 12,
                    padding: "0 18px",
                    fontWeight: "bold",
                    cursor: !referralLink
                      ? "not-allowed"
                      : "pointer",
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
