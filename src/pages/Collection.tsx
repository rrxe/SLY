import UiIcons from "../components/UiIcons";

export default function Collection() {
  return (
    <section className="collection-page" style={{ padding: "12px 0", color: "#eaf3ff" }}>
      <div
        style={{
          padding: "48px 24px",
          borderRadius: "32px",
          background: "radial-gradient(circle at top, rgba(23, 38, 68, 0.85) 0%, rgba(9, 15, 27, 0.95) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "18px",
          marginTop: "16px"
        }}
      >
        <div
          style={{
            width: "88px",
            height: "88px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(79, 132, 255, 0.2) 0%, rgba(11, 20, 38, 0.8) 100%)",
            border: "1px solid rgba(79, 132, 255, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 35px rgba(79, 132, 255, 0.3)"
          }}
        >
          <UiIcons name="coins" className="stat-icon cyan" style={{ width: 42, height: 42 }} />
        </div>

        <span
          style={{
            padding: "6px 18px",
            borderRadius: "999px",
            background: "rgba(0, 240, 156, 0.12)",
            border: "1px solid rgba(0, 240, 156, 0.3)",
            color: "#00f09c",
            fontSize: "12px",
            fontWeight: 800,
            letterSpacing: "2.5px",
            textTransform: "uppercase"
          }}
        >
          Coming Soon
        </span>

        <h2 style={{ margin: 0, fontSize: "30px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.5px" }}>
          Gems & Artifacts Vault
        </h2>

        <p style={{ margin: 0, color: "#8c98b5", fontSize: "15px", lineHeight: "1.7", maxWidth: "310px" }}>
          Collection system, space gems, and skin rewards will unlock in Season 2.
        </p>
      </div>
    </section>
  );
}
