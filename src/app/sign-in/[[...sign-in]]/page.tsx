import { SignIn } from "@clerk/nextjs";
import { EmbeddedBrowserWarning } from "@/components/EmbeddedBrowserWarning";

export default function SignInPage() {
  return (
    <>
      <EmbeddedBrowserWarning />
      <div className="flex min-h-screen items-center justify-center pt-20">
        <SignIn />
      </div>
    </>
  );
}
