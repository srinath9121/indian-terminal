export default function Section({ title, children, className = "" }) {
  return (
    <section className={`terminal-card p-4 ${className}`}>
      {title ? <h2 className="terminal-section-title">{title}</h2> : null}
      {children}
    </section>
  );
}
