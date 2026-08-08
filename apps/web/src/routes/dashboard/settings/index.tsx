import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { createFileRoute } from "@tanstack/react-router";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@package/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@package/ui/components/field";
import { Button } from "@package/ui/components/button";
import { Input } from "@package/ui/components/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@package/ui/components/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/custom/form";
import { PasswordInput } from "@/components/custom/password-input";
import { passwordFormSchema } from "@/lib/validation-schemas";
import { useChangePassword, useDeleteAccount } from "@/hooks/use-user";

export const Route = createFileRoute("/dashboard/settings/")({
  component: RouteComponent,
});

function ChangePasswordCard() {
  const changePasswordMutation = useChangePassword();

  const form = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    mode: "onChange",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: z.infer<typeof passwordFormSchema>) {
    changePasswordMutation.mutate(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      { onSuccess: () => form.reset() },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>
          Update the password you use to log in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel htmlFor="currentPassword">
                        Current password
                      </FieldLabel>
                      <FormControl>
                        <PasswordInput
                          id="currentPassword"
                          autoComplete="current-password"
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
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel htmlFor="newPassword">
                        New password
                      </FieldLabel>
                      <FormControl>
                        <PasswordInput
                          id="newPassword"
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
                        Confirm new password
                      </FieldLabel>
                      <FormControl>
                        <PasswordInput
                          id="confirmPassword"
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
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                >
                  Change password
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function DeleteAccountCard() {
  const [password, setPassword] = useState("");
  const [open, setOpen] = useState(false);
  const deleteAccountMutation = useDeleteAccount();

  function handleDelete() {
    deleteAccountMutation.mutate(password, {
      onSuccess: () => setOpen(false),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delete account</CardTitle>
        <CardDescription>
          Permanently delete your account and all of its data. This cannot be
          undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger render={<Button variant="destructive" />}>
            Delete account
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                Enter your password to confirm. This will permanently delete
                your account and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Field>
              <FieldLabel htmlFor="delete-password">Password</FieldLabel>
              <Input
                id="delete-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={deleteAccountMutation.isPending || !password}
                onClick={handleDelete}
              >
                Delete account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

function RouteComponent() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <ChangePasswordCard />
      <DeleteAccountCard />
    </div>
  );
}
