import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2Icon, CircleAlertIcon } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

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
import { Badge } from "@package/ui/components/badge";
import { Spinner } from "@package/ui/components/spinner";
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
import {
  useChangePassword,
  useDeleteAccount,
  useUser,
  useListAccounts,
  useLinkGoogle,
  useUnlinkAccount,
} from "@/hooks/use-user";

export const Route = createFileRoute("/dashboard/settings/")({
  component: RouteComponent,
});

function AccountCard() {
  const { data } = useUser();
  const user = data?.user;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Your account's basic details.</CardDescription>
      </CardHeader>
      <CardContent>
        <Field>
          <FieldLabel>Email</FieldLabel>
          <div className="flex items-center gap-2">
            <span className="text-sm">{user?.email}</span>
            {user?.emailVerified ? (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2Icon className="size-3.5" />
                Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-amber-600">
                <CircleAlertIcon className="size-3.5" />
                Not verified
              </Badge>
            )}
          </div>
        </Field>
      </CardContent>
    </Card>
  );
}

const SOCIAL_PROVIDERS = [
  { id: "google", label: "Google", icon: FcGoogle },
] as const;

function LinkedAccountsCard() {
  const accountsQuery = useListAccounts();
  const linkGoogleMutation = useLinkGoogle();
  const unlinkAccountMutation = useUnlinkAccount();

  const linkedProviderIds = new Set(
    accountsQuery.data?.map((account) => account.providerId),
  );
  const canUnlink = (accountsQuery.data?.length ?? 0) > 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Linked accounts</CardTitle>
        <CardDescription>
          Connect a social account to sign in without a password.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {SOCIAL_PROVIDERS.map((provider) => {
          const isLinked = linkedProviderIds.has(provider.id);
          return (
            <div
              key={provider.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="flex items-center gap-2">
                <provider.icon className="size-4" />
                <span className="text-sm font-medium">{provider.label}</span>
                {isLinked && <Badge variant="secondary">Connected</Badge>}
              </div>
              {isLinked ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canUnlink || unlinkAccountMutation.isPending}
                  title={
                    canUnlink
                      ? undefined
                      : "Set a password or link another account first, so you don't lock yourself out"
                  }
                  onClick={() => unlinkAccountMutation.mutate(provider.id)}
                >
                  {unlinkAccountMutation.isPending ? <Spinner /> : "Disconnect"}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={linkGoogleMutation.isPending}
                  onClick={() => linkGoogleMutation.mutate()}
                >
                  {linkGoogleMutation.isPending ? <Spinner /> : "Connect"}
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

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
      <AccountCard />
      <LinkedAccountsCard />
      <ChangePasswordCard />
      <DeleteAccountCard />
    </div>
  );
}
