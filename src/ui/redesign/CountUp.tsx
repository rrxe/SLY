import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

type Props = {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
};

function format(v: number, decimals: number) {
  return decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString();
}

/** React Bits–style CountUp. Writes straight to the DOM node (no React re-renders per frame). */
export default function CountUp({ value, decimals = 0, duration = 1.1, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);

  useGSAP(
    () => {
      const state = { v: shown.current };
      gsap.to(state, {
        v: value,
        duration: shown.current === 0 ? duration : Math.min(duration, 0.6),
        ease: "power2.out",
        onUpdate: () => {
          shown.current = state.v;
          if (ref.current) ref.current.textContent = format(state.v, decimals);
        },
        onComplete: () => {
          shown.current = value;
          if (ref.current) ref.current.textContent = format(value, decimals);
        },
      });
    },
    { dependencies: [value, decimals] },
  );

  return (
    <span ref={ref} className={className}>
      {format(value, decimals)}
    </span>
  );
}
