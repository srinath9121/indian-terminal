const styles = {
  bullish: "bg-[rgba(34,197,94,0.14)] text-[var(--green)]",
  defensive: "bg-[rgba(239,68,68,0.14)] text-[var(--red)]",
  neutral: "bg-[rgba(250,204,21,0.14)] text-[var(--yellow)]",
};

export default function Badge({ tone = "neutral", children }) {
  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-semibold ${styles[tone] || styles.neutral}`}>
      {children}
    </span>
  );
}
