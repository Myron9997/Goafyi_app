import ViewerLogin from "../../pages/ViewerLogin";
import { Suspense } from "react";

export default function ViewerLoginPage() {
  return (
    <Suspense fallback={null}>
      <ViewerLogin />
    </Suspense>
  );
}
