import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { UseMutationResult } from "@tanstack/react-query";

import { cn } from "@package/ui/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/custom/form";
import { Button } from "@package/ui/components/button";
import { FcGoogle } from "react-icons/fc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@package/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@package/ui/components/field";
import { Input } from "@package/ui/components/input";

import { PasswordInput } from "@/components/custom/password-input";
import { Link } from "@tanstack/react-router";
import {
  useLogin,
  useRequestPasswordReset,
  useMagicLinkSignIn,
} from "@/hooks/use-user";
import { loginFormSchema } from "@/lib/validation-schemas";
import { signIn } from "@/lib/auth-client";
import { FRONTEND_URL } from "@/config";

const formSchema = loginFormSchema;

type Step = "password" | "forgot-password" | "magic-link";

function EmailOnlyStep({
  fieldId,
  submitLabel,
  sentMessage,
  onBack,
  mutation,
}: {
  fieldId: string;
  submitLabel: string;
  sentMessage: (email: string) => string;
  onBack: () => void;
  mutation: UseMutationResult<unknown, Error, string>;
}) {
  const [email, setEmail] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate(email);
  }

  if (mutation.isSuccess) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm text-muted-foreground">{sentMessage(email)}</p>
        <Button variant="outline" type="button" onClick={onBack}>
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={fieldId}>Email</FieldLabel>
          <Input
            id={fieldId}
            type="email"
            placeholder="m@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field>
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            {submitLabel}
          </Button>
          <FieldDescription className="text-center">
            <button type="button" onClick={onBack} className="underline">
              Back to login
            </button>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}

export default function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [step, setStep] = useState<Step>("password");
  const { mutate, isPending } = useLogin();
  const requestPasswordResetMutation = useRequestPasswordReset();
  const magicLinkSignInMutation = useMagicLinkSignIn();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });
  async function LoginWithGoogle() {
    await signIn.social({
      provider: "google",
      callbackURL: `${FRONTEND_URL}/dashboard`,
    });
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutate(values);
  }

  if (step === "forgot-password") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Reset your password</CardTitle>
            <CardDescription>
              Enter your email and we&apos;ll send you a reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmailOnlyStep
              fieldId="reset-email"
              submitLabel="Send reset link"
              sentMessage={(email) =>
                `If an account exists for ${email}, a reset link has been sent.`
              }
              onBack={() => setStep("password")}
              mutation={requestPasswordResetMutation}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "magic-link") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Sign in with email</CardTitle>
            <CardDescription>
              Enter your email and we&apos;ll send you a sign-in link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmailOnlyStep
              fieldId="magic-link-email"
              submitLabel="Send sign-in link"
              sentMessage={(email) => `Check ${email} for a link to sign in.`}
              onBack={() => setStep("password")}
              mutation={magicLinkSignInMutation}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your Google account or Credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <Field>
                  <Button
                    variant="outline"
                    onClick={LoginWithGoogle}
                    type="button"
                    disabled={isPending}
                  >
                    <FcGoogle />
                    Login with Google
                  </Button>
                </Field>
                <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                  Or continue with
                </FieldSeparator>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <FormControl>
                          <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            autoComplete="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </Field>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <Field>
                        <div className="flex items-center">
                          <FieldLabel htmlFor="password">Password</FieldLabel>
                          <button
                            type="button"
                            onClick={() => setStep("forgot-password")}
                            className="ml-auto text-sm underline-offset-4 hover:underline"
                          >
                            Forgot your password?
                          </button>
                        </div>
                        <FormControl>
                          <PasswordInput
                            id="password"
                            placeholder="******"
                            autoComplete="password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </Field>
                    </FormItem>
                  )}
                />
                <Field>
                  <Button
                    type="submit"
                    className="w-full"
                    // disabled={isLoading}
                  >
                    Login
                  </Button>
                  <FieldDescription className="text-center">
                    <button
                      type="button"
                      onClick={() => setStep("magic-link")}
                      className="underline"
                    >
                      Sign in with an email link instead
                    </button>
                  </FieldDescription>
                  <FieldDescription className="text-center">
                    Don&apos;t have an account?{" "}
                    <Link to="/auth/register" className="underline">
                      Sign up
                    </Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </Form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our{" "}
        <Link to="/" className="underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link to="/" className="underline">
          Privacy Policy
        </Link>
        .
      </FieldDescription>
    </div>
  );
}
