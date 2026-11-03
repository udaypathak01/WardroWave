const PARTICLES = Array.from({ length: 15 }, (_, i) => ({
  width: `${((i * 7) % 8) + 4}px`,
  height: `${((i * 7) % 8) + 4}px`,
  left: `${((i * 17) % 95) + 2}%`,
  top: `${((i * 23) % 90) + 5}%`,
  animationDuration: `${((i * 3) % 15) + 10}s`,
  animationDelay: `-${((i * 2) % 10)}s`,
}));

export default function ThemeBubbles() {
  return (
    <div aria-hidden="true" className="theme-bubbles absolute inset-0 overflow-hidden pointer-events-none z-0">
      {PARTICLES.map((style, index) => (
        <div key={index} className="particle" style={style} />
      ))}
    </div>
  );
}
