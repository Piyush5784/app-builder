import { useUser } from "@/hooks/use-user";
import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@package/ui/components/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@package/ui/components/avatar";
import { Badge } from "@package/ui/components/badge";
import { Button } from "@package/ui/components/button";
import { Separator } from "@package/ui/components/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@package/ui/components/tabs";
import { Mail, Calendar, Lock, Edit, Grid3x3, Bookmark } from "lucide-react";

export const Route = createFileRoute("/dashboard/Profile/")({
  component: RouteComponent,
});

function ProfilePage() {
  const { data } = useUser();
  const user = data?.user;

  const initials = user?.name
    ? user.name.substring(0, 2).toUpperCase()
    : (user?.email?.substring(0, 2).toUpperCase() ?? "?");

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";

  const stats = [
    { label: "Posts", value: user?.postsCount ?? 0 },
    { label: "Followers", value: user?.followersCount ?? 0 },
    { label: "Following", value: user?.followingCount ?? 0 },
  ];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-4 text-center">
            <div className="mb-4 flex justify-center">
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                <AvatarImage
                  src={user?.image || ""}
                  alt={user?.name || user?.username || user?.email}
                />
                <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
              </Avatar>
            </div>

            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              {user?.name || "Anonymous"}
              {user?.isPrivate && (
                <Lock
                  className="h-4 w-4 text-muted-foreground"
                  aria-label="Private account"
                />
              )}
            </CardTitle>

            {user?.username && (
              <CardDescription className="text-sm">
                @{user.username}
              </CardDescription>
            )}

            <CardDescription className="mt-1 flex items-center justify-center gap-2">
              <Mail className="h-4 w-4" />
              {user?.email}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {user?.bio && (
              <p className="text-center text-sm leading-relaxed text-muted-foreground">
                {user.bio}
              </p>
            )}

            {/* Stats row */}
            <div className="flex items-center justify-around py-2">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-lg leading-none font-semibold">
                    {stat.value.toLocaleString()}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Joined {joinDate}</span>
            </div>

            {user?.isPrivate && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Private account</Badge>
                </div>
              </>
            )}

            <Button className="w-full" variant="default">
              <Edit className="mr-2 h-4 w-4" />
              Edit profile
            </Button>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="md:col-span-2">
          <Tabs defaultValue="posts" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="posts">
                  <Grid3x3 className="mr-2 h-4 w-4" />
                  Posts
                </TabsTrigger>
                <TabsTrigger value="saved">
                  <Bookmark className="mr-2 h-4 w-4" />
                  Saved
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="posts" className="space-y-4">
                {user?.postsCount ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    {/* TODO: wire up real posts query, e.g. GET /api/users/:id/posts */}
                    Post grid goes here.
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Grid3x3 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="text-sm font-medium">No posts yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      When you share posts, they'll appear here.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="saved" className="space-y-4">
                <div className="py-12 text-center">
                  {/* TODO: wire up real saved posts query, e.g. GET /api/users/:id/saved */}
                  <Bookmark className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium">No saved posts yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Posts you save will appear here.
                  </p>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

function RouteComponent() {
  return <ProfilePage />;
}
