import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-white">
      <Navbar />
      <main className="mx-auto max-w-[1400px] px-6 py-6">
        {children}
      </main>
    </div>
  );
}
