const map = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

export default function Grid({ cols = 3, className = "", children }) {
  return <div className={`grid ${map[cols]} gap-4 ${className}`}>{children}</div>;
}
