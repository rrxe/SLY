import "../styles/dashboard.css";

export default function Dashboard() {
  return (
    <section className="dashboard">

      <div className="dash-card">

        <div className="dash-head">
          <span>⚡ Energy</span>
          <strong>85 / 100</strong>
        </div>

        <div className="progress">
          <div className="progress-fill energy"></div>
        </div>

      </div>

      <div className="dash-card">

        <div className="dash-head">
          <span>⭐ XP</span>
          <strong>Level 3</strong>
        </div>

        <div className="progress">
          <div className="progress-fill xp"></div>
        </div>

      </div>

      <div className="dash-card">

        <div className="dash-head">
          <span>🏆 Best Score</span>
          <strong>12,450</strong>
        </div>

        <div className="progress">
          <div className="progress-fill best"></div>
        </div>

      </div>

    </section>
  );
}
