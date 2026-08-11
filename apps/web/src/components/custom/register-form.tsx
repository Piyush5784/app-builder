import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

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
// Disabled until we have a real GH_CLIENT_ID/GH_CLIENT_SECRET.
// import { FaGithub } from "react-icons/fa";
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

import { registerFormSchema } from "@/lib/validation-schemas";
import { Link } from "@tanstack/react-router";
import { useRegister } from "@/hooks/use-user";
import { signIn } from "@/lib/auth-client";
import { FRONTEND_URL } from "@/config";

const formSchema = registerFormSchema;

export default function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      username: "",
      confirmPassword: "",
    },
  });

  const { mutate, isPending } = useRegister();

  async function loginWithGoogle() {
    await signIn.social({
      provider: "google",
      callbackURL: `${FRONTEND_URL}/dashboard`,
    });
  }

  // Disabled until we have a real GH_CLIENT_ID/GH_CLIENT_SECRET.
  // async function loginWithGithub() {
  //   await signIn.social({
  //     provider: "github",
  //     callbackURL: `${FRONTEND_URL}/dashboard`,
  //   });
  // }

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutate({
      email: values.email,
      name: values.username,
      password: values.password,
    });
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create an account</CardTitle>
          <CardDescription>
            Sign up with your Google account or Credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <Field>
                  <Button
                    variant="outline"
                    onClick={loginWithGoogle}
                    type="button"
                    disabled={isPending}
                  >
                    <FcGoogle />
                    Sign up with Google
                  </Button>
                  {/* Disabled until we have a real GH_CLIENT_ID/GH_CLIENT_SECRET. */}
                  {/* <Button
                    variant="outline"
                    onClick={loginWithGithub}
                    type="button"
                    disabled={isPending}
                  >
                    <FaGithub />
                    Sign up with GitHub
                  </Button> */}
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
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel htmlFor="name">Name</FieldLabel>
                        <FormControl>
                          <Input
                            id="name"
                            type="text"
                            placeholder="John Doe"
                            autoComplete="name"
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
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <FormControl>
                          <PasswordInput
                            id="password"
                            placeholder="******"
                            autoComplete="new-password"
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
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel htmlFor="confirmPassword">
                          Confirm Password
                        </FieldLabel>
                        <FormControl>
                          <PasswordInput
                            id="confirmPassword"
                            placeholder="******"
                            autoComplete="new-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </Field>
                    </FormItem>
                  )}
                />
                <Field>
                  <Button type="submit" disabled={isPending} className="w-full">
                    {isPending ? "Registering..." : "Register"}
                  </Button>
                  <FieldDescription className="text-center">
                    Already have an account?{" "}
                    <Link to="/auth/login" className="underline">
                      Login
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
