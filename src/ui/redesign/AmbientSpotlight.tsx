import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * One fixed glow that follows the finger / pointer.
 * GPU-only: transform + opacity, driven by gsap.quickTo. Cleans up all listeners.
 */
export default function AmbientSpotlight() {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const xTo = gsap.quickTo(node, "x", { duration: 0.35, ease: "power3.out" });
    const yTo = gsap.quickTo(node, "y", { duration: 0.35, ease: "power3.out" });
    let hideTimer = 0;

    const show = () => {
      window.clearTimeout(hideTimer);
      gsap.to(node, { opacity: 1, duration: 0.25, overwrite: "auto" });
    };
    const hide = (delay = 0.2) => gsap.to(node, { opacity: 0, duration: 0.6, delay, overwrite: "auto" });

    const move = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };
    const down = (e: PointerEvent) => {
      gsap.set(node, { x: e.clientX, y: e.clientY });
      show();
    };
    const up = () => hide();

    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    window.addEventListener("pointercancel", up, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      gsap.killTweensOf(node);
    };
  }, []);

  return <div ref={el} className="rd-spotlight" aria-hidden="true" />;
}
