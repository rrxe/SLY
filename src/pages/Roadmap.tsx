import "../styles/roadmap.css";
import PageShell from "../components/PageShell";

export default function Roadmap() {
  return (
    <PageShell
      eyebrow="PROJECT TIMELINE"
      title="Roadmap"
      subtitle="Building the future of SLY step by step."
    >
      <div className="timeline">
        <div className="timeline-item completed">
          <div className="timeline-dot" />
          <div className="timeline-card">
            <h3>Season 1</h3>
            <p>Launch the first version of Laser Escape, Daily Rewards, XP System and Community Tasks.</p>
            <span className="status done">COMPLETED</span>
          </div>
        </div>

        <div className="timeline-item current">
          <div className="timeline-dot" />
          <div className="timeline-card">
            <h3>Season 2</h3>
            <p>New drones, bosses, cosmetics, achievements and leaderboard.</p>
            <span className="status progress">IN PROGRESS</span>
          </div>
        </div>

        <div className="timeline-item">
          <div className="timeline-dot" />
          <div className="timeline-card">
            <h3>Marketplace</h3>
            <p>Trade ships and cosmetics securely with other players.</p>
            <span className="status soon">COMING SOON</span>
          </div>
        </div>

        <div className="timeline-item">
          <div className="timeline-dot lock" />
          <div className="timeline-card">
            <h3>Secret Update</h3>
            <p>A major feature is hidden until launch.</p>
            <span className="status locked">SECRET</span>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
