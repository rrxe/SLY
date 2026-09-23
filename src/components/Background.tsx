import "../styles/background.css";

export default function Background() {
  return (
    <div className="app-bg" aria-hidden="true">
      <div className="app-bg__stars app-bg__stars--a" />
      <div className="app-bg__stars app-bg__stars--b" />
    </div>
  );
}
