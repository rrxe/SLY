// ألوان الألعاب مرسومة داخل الكانفس بالكود، فما يطبّق عليها CSS.
// هنا نعترض الألوان وقت الرسم ونحوّلها لرمادي لما الوضع أبيض وأسود.
// التحويل يتخزّن بكاش، فما فيه أي كلفة تذكر على الفريمات.

let mono = false;

export function setCanvasMono(value: boolean) {
  mono = value;
}

const cache = new Map<string, string>();

function convert(input: string): string {
  const s = input.trim().toLowerCase();
  let r = NaN;
  let g = NaN;
  let b = NaN;
  let a = 1;

  const hex = /^#([0-9a-f]{3,8})$/.exec(s);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) {
      h = h
        .split("")
        .map((x) => x + x)
        .join("");
    }
    if (h.length !== 6 && h.length !== 8) return input;
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
    if (h.length === 8) a = parseInt(h.slice(6, 8), 16) / 255;
  } else {
    const fn = /^rgba?\(([^)]+)\)$/.exec(s);
    if (!fn) return input; // white / black / transparent وغيرها: أصلاً محايدة
    const p = fn[1].split(/[\s,/]+/).filter(Boolean);
    r = parseFloat(p[0]);
    g = parseFloat(p[1]);
    b = parseFloat(p[2]);
    if (p[3] !== undefined) {
      a = p[3].endsWith("%") ? parseFloat(p[3]) / 100 : parseFloat(p[3]);
    }
  }

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b) || Number.isNaN(a)) {
    return input;
  }

  const y = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  return a >= 1
    ? `rgb(${y},${y},${y})`
    : `rgba(${y},${y},${y},${Math.round(a * 1000) / 1000})`;
}

export function toGray(color: string): string {
  const hit = cache.get(color);
  if (hit !== undefined) return hit;
  const out = convert(color);
  if (cache.size > 600) cache.clear();
  cache.set(color, out);
  return out;
}

const COLOR_PROPS = ["fillStyle", "strokeStyle", "shadowColor"] as const;
const GRADIENTS = [
  "createLinearGradient",
  "createRadialGradient",
  "createConicGradient",
] as const;

function patch(ctx: CanvasRenderingContext2D) {
  const proto = CanvasRenderingContext2D.prototype;

  for (const prop of COLOR_PROPS) {
    const d = Object.getOwnPropertyDescriptor(proto, prop);
    if (!d || !d.get || !d.set) continue;
    const get = d.get;
    const set = d.set;
    Object.defineProperty(ctx, prop, {
      configurable: true,
      enumerable: true,
      get() {
        return get.call(ctx);
      },
      set(v: unknown) {
        set.call(ctx, typeof v === "string" ? toGray(v) : v);
      },
    });
  }

  const target = ctx as unknown as Record<string, unknown>;
  for (const name of GRADIENTS) {
    const orig = target[name];
    if (typeof orig !== "function") continue;
    target[name] = (...args: unknown[]) => {
      const grad = orig.apply(ctx, args) as CanvasGradient;
      const add = grad.addColorStop.bind(grad);
      grad.addColorStop = (offset: number, color: string) =>
        add(offset, toGray(color));
      return grad;
    };
  }
}

// بديل لـ canvas.getContext("2d") داخل الألعاب
export function themedContext(
  canvas: HTMLCanvasElement,
  options?: CanvasRenderingContext2DSettings,
): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext("2d", options);
  if (ctx && mono) patch(ctx);
  return ctx;
}
