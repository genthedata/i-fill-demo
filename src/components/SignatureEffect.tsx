import { useEffect, useRef } from "react";

// Subtle animated gradient underline used as a tasteful signature interaction.
export default function SignatureEffect() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let t = 0;
    const animate = () => {
      t += 0.008;
      const p = (Math.sin(t) + 1) / 2; // 0..1
      el.style.opacity = String(0.4 + p * 0.3);
      raf = requestAnimationFrame(animate);
    };
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      raf = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none mt-1 h-1 w-36 rounded-full"
      style={{
        background: 'var(--gradient-primary)'
      }}
    />
  );
}
