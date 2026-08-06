import "../styles/tasks.css";
import PageShell from "../components/PageShell";

export default function Tasks() {
  return (
    <PageShell
      eyebrow="TASK CENTER"
      title="Daily Tasks"
      subtitle="Complete missions and earn SLY Coins."
    >
      <div className="task-card">
        <div className="task-left">
          <div className="task-icon">📢</div>
          <div>
            <h3>Join Telegram</h3>
            <small>Reward: +500 Coins</small>
          </div>
        </div>
        <button>GO</button>
      </div>

      <div className="task-card">
        <div className="task-left">
          <div className="task-icon">𝕏</div>
          <div>
            <h3>Follow X</h3>
            <small>Reward: +1000 Coins</small>
          </div>
        </div>
        <button>GO</button>
      </div>

      <div className="task-card">
        <div className="task-left">
          <div className="task-icon">👥</div>
          <div>
            <h3>Invite 3 Friends</h3>
            <small>Reward: +2500 Coins</small>
          </div>
        </div>
        <button>GO</button>
      </div>

      <div className="task-card">
        <div className="task-left">
          <div className="task-icon">🎮</div>
          <div>
            <h3>Play One Match</h3>
            <small>Reward: +800 Coins</small>
          </div>
        </div>
        <button>DONE</button>
      </div>
    </PageShell>
  );
}
