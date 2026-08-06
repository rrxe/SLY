import "../styles/background.css";

export default function Background() {
  return (
    <div className="space" aria-hidden="true">
      <div className="nebula nebula1" />
      <div className="nebula nebula2" />
      <div className="nebula nebula3" />
      <div className="grid" />
      <div className="noise" />
      <div className="stars">
        {Array.from({ length: 120 }).map((_, i) => (
          <span
            key={i}
            className="star"
            style={{
              left: `${(i * 9 + (i % 11) * 13) % 100}%`,
              top: `${(i * 17 + (i % 7) * 19) % 100}%`,
              animationDelay: `${(i % 12) * 0.22}s`,
              animationDuration: `${5 + (i % 8) * 0.55}s`,
              opacity: 0.15 + (i % 6) * 0.08,
            }}
          />
        ))}
      </div>
    </div>
  );
}
