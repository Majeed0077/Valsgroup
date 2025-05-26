// src/app/layout.js
import './globals.css';
import 'leaflet/dist/leaflet.css';
import ClientLayout from '@/components/ClientLayout';

export const metadata = {
  title: 'Visual Telematics Platform',
  description: 'Visual Telematics Platform ',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
