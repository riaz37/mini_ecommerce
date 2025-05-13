import { AuthProvider } from "@/context/AuthContext";
import { Providers } from "@/store/provider"; // Import Redux provider
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartMergeProvider } from "@/providers/CartMergeProvider";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "E-Commerce",
  description: "Your one-stop shop for all your needs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {" "}
          {/* Redux provider */}
          <AuthProvider>
            <CartMergeProvider>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow">{children}</main>
                <Footer />
                <Toaster
                  position="bottom-right"
                  toastOptions={{
                    style: {
                      background: "#363636",
                      color: "#fff",
                      borderRadius: "8px",
                      padding: "16px",
                    },
                    success: {
                      style: {
                        background: "#4CAF50",
                      },
                    },
                    error: {
                      style: {
                        background: "#F44336",
                      },
                    },
                  }}
                />
              </div>
            </CartMergeProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
