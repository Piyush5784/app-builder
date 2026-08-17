import { createFileRoute } from "@tanstack/react-router";
import RegisterForm from "@/components/custom/register-form";
import { useRedirectIfAuthenticated } from "@/hooks/use-user";

function Register() {
  useRedirectIfAuthenticated();

  return (
    <div>
      <RegisterForm />
    </div>
  );
}

export const Route = createFileRoute("/auth/register/")({
  component: Register,
});
