import { useEffect } from "react";

const EMBERS = 9;
const rnd = (min: number, max: number) => min + Math.random() * (max - min);

/** Adds an independent, randomly-timed set of purple embers to every Mythic chip. */
function decorate(chip: HTMLElement) {
  if (chip.dataset.rdFlair) return;
  chip.dataset.rdFlair = "1";
  chip.style.setProperty("--rd-fd", `${-rnd(0, 2.4).toFixed(2)}s`);
  chip.style.setProperty("--rd-fdur", `${rnd(1.9, 2.8).toFixed(2)}s`);

  for (let i = 0; i < EMBERS; i += 1) {
    const e = document.createElement("i");
    e.className = `rd-ember${i % 3 === 0 ? " rd-ember--w" : ""}`;
    e.setAttribute("aria-hidden", "true");
    const dur = rnd(1.2, 3.1);
    e.style.cssText =
      `left:${rnd(8, 92).toFixed(1)}%;` +
      `--s:${rnd(2, 4).toFixed(1)}px;` +
      `--rise:${(-rnd(20, 44)).toFixed(0)}px;` +
      `--dx:${rnd(-9, 9).toFixed(1)}px;` +
      `animation-duration:${dur.toFixed(2)}s;` +
      `animation-delay:${(-rnd(0, dur)).toFixed(2)}s;`;
    chip.appendChild(e);
  }
}

function scan() {
  document.querySelectorAll<HTMLElement>(".tier.mythic:not([data-rd-flair])").forEach(decorate);
}

export default function TierFlair() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        scan();
      });
    };
    scan();
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
