export default function Card({ children, className = "" }) {
  return (
    <div className={`terminal-card p-4 ${className}`}>
      {children}
    </div>
  );
}
