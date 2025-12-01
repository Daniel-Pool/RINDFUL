import "./globals.css";
import { Inter } from "next/font/google";
import ClientWrapper from "./components/ClientWrapper";
import DBInitializer from './components/DBInitializer';


const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "RINDFUL",
  description: "RINDFUL - By Pentigator",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white m-0 p-0`}>
        <DBInitializer />
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
}