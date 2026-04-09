/**
 * CPITracker — Root Application Component
 *
 * Sets up routing between the search home page, the
 * transaction analysis view, and the simulate page.
 * Renders the persistent header/nav shell.
 */

// --- deps ---
import { Routes, Route } from 'react-router-dom';

// --- local ---
import { HomePage } from './pages/home.page';
import styles from './App.module.css';

export function App() {
  return (
    <div className={styles.appShell}>
      <header className={styles.header}>
        <div className={styles.logoBlock}>
          <span className={styles.logoSymbol}>&gt;_</span>
          <h1 className={styles.logoText}>CPITracker</h1>
        </div>
        <nav className={styles.nav}>
          <a href="/" className={styles.navLink}>search</a>
          <a href="/simulate" className={styles.navLink}>simulate</a>
        </nav>
      </header>

      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tx/:signature" element={<div>analysis view — coming soon</div>} />
          <Route path="/simulate" element={<div>simulate view — coming soon</div>} />
        </Routes>
      </main>

      <footer className={styles.footer}>
        <span className={styles.footerText}>
          CPITracker v0.1.0 — Solana CPI call tree debugger
        </span>
      </footer>
    </div>
  );
}
