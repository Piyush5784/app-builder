import { createFileRoute } from "@tanstack/react-router";
import LoginForm from "@/components/custom/login-form";
import { useRedirectIfAuthenticated } from "@/hooks/use-user";

function Login() {
  useRedirectIfAuthenticated();

  return (
    <div>
      <LoginForm />
    </div>
  );
}

export const Route = createFileRoute("/auth/login/")({
  component: Login,
});
