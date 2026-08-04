import { createFileRoute } from "@tanstack/react-router";
import LoginForm from "@/components/custom/login-form";

function Login() {
  return (
    <div>
      <LoginForm />
    </div>
  );
}

export const Route = createFileRoute("/auth/Login/")({
  component: Login,
});
