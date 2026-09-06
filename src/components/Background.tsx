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
        {Array.from({ length: 48 }).map((_, i) => {
          const dx = ((i * 37) % 40) - 20;
          const dy = ((i * 53) % 40) - 20;

          return (
            <span
              key={i}
              className="star"
              style={
                {
                  left: `${(i * 9 + (i % 11) * 13) % 100}%`,
                  top: `${(i * 17 + (i % 7) * 19) % 100}%`,
                  animationDelay: `${(i % 12) * 0.22}s`,
                  animationDuration: `${9 + (i % 8) * 1.1}s`,
                  opacity: 0.12 + (i % 6) * 0.06,
                  "--dx": `${dx}px`,
                  "--dy": `${dy}px`,
                } as React.CSSProperties
              }
            />
          );
        })}
      </div>
    </div>
  );
}
