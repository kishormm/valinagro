import './globals.css';
import DatabaseInitializer from '@/components/DatabaseInitializer';
import { Toaster } from 'react-hot-toast'; 

export const metadata = {
  title: 'MLM App',
  description: 'Multi-Level Management Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Toaster position="top-center" reverseOrder={false} />
        <DatabaseInitializer />
        {children}
      </body>
    </html>
  );
}