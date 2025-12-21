
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body style={{ fontFamily: "sans-serif", padding: 20 }}>
        <h1>QuoAgent Dashboard</h1>
        {children}
      </body>
    </html>
  )
}
