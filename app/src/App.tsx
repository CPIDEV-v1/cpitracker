/**
 * CPITracker — Root Application Component
 *
 * Routes: landing page at /, app shell at /app,
 * transaction analysis at /tx/:signature.
 */

// --- deps ---
import { Routes, Route, Link, Outlet } from 'react-router-dom';

// --- local ---
import { LandingPage } from './pages/landing.page';
import { HomePage } from './pages/home.page';
import { AnalysisPage } from './pages/analysis.page';
import styles from './App.module.css';

function AppShell() {
  return (
    <div className={styles.appShell}>
      <header className={styles.header}>
        <div className={styles.logoBlock}>
          <Link to="/" className={styles.logoLink}>
            <span className={styles.logoSymbol}>&gt;_</span>
            <h1 className={styles.logoText}>CPITracker</h1>
          </Link>
        </div>
        <nav className={styles.nav}>
          <Link to="/app" className={styles.navLink}>search</Link>
          <Link to="/simulate" className={styles.navLink}>simulate</Link>
        </nav>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <span className={styles.footerText}>
          CPITracker v0.1.0 — Solana CPI call tree debugger
        </span>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="tx/:signature" element={<AnalysisPage />} />
        <Route path="simulate" element={<div>simulate view — coming soon</div>} />
      </Route>
      {/* Legacy direct /tx route — redirect-free, just works */}
      <Route path="/tx/:signature" element={<AppShell />}>
        <Route index element={<AnalysisPage />} />
      </Route>
    </Routes>
  );
}
