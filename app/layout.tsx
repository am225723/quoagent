import './globals.css';

export const metadata = { title: 'QuoAgent', description: 'OpenPhone cleanup + reply approval' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
          <header style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 16 }}>
            <h1 style={{ margin: 0 }}>QuoAgent</h1>
            <nav style={{ display: 'flex', gap: 12 }}>
              <a href="/run">Run</a>
              <a href="/review">Review</a>
              <a href="/history">History</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
