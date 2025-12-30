import './globals.css';

export const metadata = {
  title: 'QuoAgent',
  description: 'OpenPhone cleanup + reply approval'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <div className="header">
            <div className="brand">
              <h1>QuoAgent</h1>
              <p>Cleanup runs, summaries, and approval-based SMS sending.</p>
            </div>
            <nav className="nav">
              <a className="pill" href="/run">Run</a>
              <a className="pill" href="/review">Review</a>
              <a className="pill" href="/history">History</a>
              <a className="pill" href="/summaries">Summaries</a>
            </nav>
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
