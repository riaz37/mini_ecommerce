import { Suspense } from "react";
import CheckoutSuccessClient from "./client";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export const dynamic = "force-dynamic";

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
          <LoadingSpinner
            size="xl"
            color="primary"
            text="Processing your payment..."
          />
        </div>
      }
    >
      <CheckoutSuccessClient />
    </Suspense>
  );
}
