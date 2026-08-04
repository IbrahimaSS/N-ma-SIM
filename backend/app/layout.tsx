export const metadata = {
  title: 'N\'ma SIM API',
  description: 'Backend API for N\'ma SIM Kiosk',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
