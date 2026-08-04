import { createFileRoute } from "@tanstack/react-router";
import RegisterForm from "@/components/custom/register-form";

function Register() {
  return (
    <div>
      <RegisterForm />
    </div>
  );
}

export const Route = createFileRoute("/auth/register/")({
  component: Register,
});
