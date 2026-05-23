import './globals.css'

export const metadata = {
  title: 'Villa Javea 2026',
  description: 'App para gestionar las vacaciones de familia y amigos',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
