import "../styles/donate.css";
import PageShell from "../components/PageShell";

export default function Donate() {
  return (
    <PageShell
      eyebrow="SUPPORT THE PROJECT"
      title="Donate"
      subtitle="Help us build a bigger and better future for SLY."
    >
      <section className="support-card">
        <div className="support-icon">💙</div>
        <h3>Support Development</h3>
        <p>
          Every donation helps us improve the game, add new content, build better servers and create amazing future updates.
        </p>

        <div className="support-buttons">
          <button className="primary">Donate with TON</button>
          <button className="secondary">Buy us a Coffee</button>
        </div>
      </section>

      <div className="goals">
        <div className="goal">
          <span>🎨</span>
          <div>
            <h4>Better Graphics</h4>
            <small>Improve UI & Effects</small>
          </div>
        </div>

        <div className="goal">
          <span>🖥️</span>
          <div>
            <h4>Game Servers</h4>
            <small>Stable Multiplayer</small>
          </div>
        </div>

        <div className="goal">
          <span>🚀</span>
          <div>
            <h4>Future Updates</h4>
            <small>New Seasons & Events</small>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
