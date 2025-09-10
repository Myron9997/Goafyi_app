import EmailConfirmation from "../../pages/EmailConfirmation";
import { Suspense } from "react";

export default function EmailConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <EmailConfirmation />
    </Suspense>
  );
}
