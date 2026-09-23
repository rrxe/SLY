type IconName =
  | "home"
  | "tasks"
  | "collection"
  | "referrals"
  | "profile"
  | "coins"
  | "energy"
  | "play"
  | "back"
  | "exchange"
  | "withdraw"
  | "leaderboard"
  | "star"
  | "games";

type Props = {
  name: IconName;
  className?: string;
};

export default function UiIcons({ name, className = "" }: Props) {
  switch (name) {
    case "home":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="m3.8 10.6 8.2-6.7 8.2 6.7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.6 10.2v8.2c0 .9.7 1.6 1.6 1.6h9.6c.9 0 1.6-.7 1.6-1.6v-8.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9.4 20v-5.4h5.2V20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "tasks":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect x="5" y="4" width="14" height="16" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="m8.2 9.2 1.4 1.4 2.5-2.7M13.8 9.6h2.1M8.2 14.3l1.4 1.4 2.5-2.7M13.8 14.7h2.1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "collection":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M12 3 4.5 7.2v9.6L12 21l7.5-4.2V7.2L12 3Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 7.2v13.8" fill="none" stroke="currentColor" strokeWidth="1.8" opacity=".35" />
        </svg>
      );
    case "referrals":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <circle cx="7.2" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17" cy="16.5" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M9.8 9.8 14.4 14M4 19.2c.6-2.7 2-4.1 4.3-4.1 1.1 0 2 .3 2.8.9M14 20c.4-1.7 1.5-2.8 3.2-3.2 1.1-.2 2.1 0 2.8.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "profile":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5.2 19.5c1-3.2 3.2-4.8 6.8-4.8s5.8 1.6 6.8 4.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M17.8 6.2h2.1M18.85 5.15v2.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "coins":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M9.2 10.2c0-1.2 1.3-2.1 2.8-2.1s2.8.9 2.8 2.1-1.1 1.7-2.8 2.2-2.8 1-2.8 2.2 1.3 2.1 2.8 2.1 2.8-.9 2.8-2.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "energy":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M13 2 5 13h5l-1 9 8-11h-5l1-9Z" fill="currentColor" />
        </svg>
      );
    case "play":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M9 7.8v8.4a1 1 0 0 0 1.5.86l7-4.2a1 1 0 0 0 0-1.72l-7-4.2A1 1 0 0 0 9 7.8Z" fill="currentColor" />
        </svg>
      );
    case "back":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M14.5 5 8 11.5l6.5 6.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 11.5h7" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      );
    case "exchange":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M4.5 8h11.8l-2.8-2.8M19.5 16H7.7l2.8 2.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16.6 5.2 19.5 8l-2.9 2.8M7.4 13.2 4.5 16l2.9 2.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "withdraw":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M6 4.5h12v6.2M12 7.8v9.1M8.4 13.4 12 17l3.6-3.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 19.5h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "leaderboard":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M5 19h14M7 19V9m5 10V5m5 14v-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path
            d="M12 2.8 14.6 9l6.6.5-5 4.4 1.6 6.4L12 16.9 6.2 20.3l1.6-6.4-5-4.4L9.4 9 12 2.8Z"
            fill="currentColor"
          />
        </svg>
      );
    case "games":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="m5.1 14.8 2.5-8.2h8.8l2.5 8.2-4-2.1a4.2 4.2 0 0 0-5.8 0l-4 2.1Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M8.4 9.4h7.2M9.4 12.2h.01M14.6 12.2h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="m10.2 6.6-1.1-2M13.8 6.6l1.1-2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
  }
}
