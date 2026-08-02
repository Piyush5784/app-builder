import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@package/ui/components/avatar";
import { Card, CardContent, CardHeader } from "@package/ui/components/card";
import { Button } from "@package/ui/components/button";
import { Separator } from "@package/ui/components/separator";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import {
  useFeed,
  useToggleLike,
  useToggleSave,
  useAddComment,
  type Post,
} from "./-hooks";

export const Route = createFileRoute("/dashboard/Home/")({
  component: RouteComponent,
});

// Stories aren't backed by any API yet — kept as decorative mock content.
const stories = [
  { name: "your_story", image: "https://i.pravatar.cc/150?img=1" },
  { name: "alex", image: "https://i.pravatar.cc/150?img=2" },
  { name: "sarah", image: "https://i.pravatar.cc/150?img=3" },
  { name: "mike", image: "https://i.pravatar.cc/150?img=4" },
  { name: "emma", image: "https://i.pravatar.cc/150?img=5" },
  { name: "john", image: "https://i.pravatar.cc/150?img=6" },
];

function PostCard({ post }: { post: Post }) {
  const [comment, setComment] = useState("");
  const toggleLike = useToggleLike();
  const toggleSave = useToggleSave();
  const addComment = useAddComment();

  const image = post.media[0]?.url;

  function handleSubmitComment() {
    const content = comment.trim();
    if (!content) return;
    addComment.mutate(
      { postId: post.id, content },
      { onSuccess: () => setComment("") },
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={post.author.image ?? undefined} />
            <AvatarFallback>
              {post.author.username[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-semibold">{post.author.username}</span>
        </div>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </CardHeader>

      {image && (
        <img
          src={image}
          alt="Post"
          className="aspect-square w-full object-cover"
        />
      )}

      <CardContent className="p-4">
        {/* Actions */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0"
              disabled={toggleLike.isPending}
              onClick={() => toggleLike.mutate(post.id)}
            >
              <Heart
                className="h-6 w-6"
                fill={post.isLiked ? "currentColor" : "none"}
                color={post.isLiked ? "#ef4444" : "currentColor"}
              />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <MessageCircle className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <Send className="h-6 w-6" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0"
            disabled={toggleSave.isPending}
            onClick={() => toggleSave.mutate(post.id)}
          >
            <Bookmark
              className="h-6 w-6"
              fill={post.isSaved ? "currentColor" : "none"}
            />
          </Button>
        </div>

        {/* Likes */}
        <p className="mb-2 text-sm font-semibold">
          {post.likesCount.toLocaleString()} likes
        </p>

        {/* Caption */}
        <p className="mb-2 text-sm">
          <span className="mr-2 font-semibold">{post.author.username}</span>
          {post.content}
        </p>

        {/* Comments */}
        <p className="mb-2 text-sm text-muted-foreground">
          {post.commentsCount > 0
            ? `View all ${post.commentsCount} comments`
            : "No comments yet"}
        </p>

        {/* Time */}
        <p className="text-xs text-muted-foreground">
          {new Date(post.createdAt).toLocaleString()}
        </p>

        <Separator className="my-3" />

        {/* Add Comment */}
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmitComment();
            }}
            placeholder="Add a comment..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button
            variant="ghost"
            className="font-semibold text-blue-500"
            disabled={addComment.isPending || !comment.trim()}
            onClick={handleSubmitComment}
          >
            Post
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RouteComponent() {
  const { data: feed, isLoading, isError } = useFeed();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-6">
        {/* Main Feed */}
        <div className="mx-auto max-w-2xl flex-1">
          {/* Stories */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="scrollbar-hide flex gap-4 overflow-x-auto">
                {stories.map((story) => (
                  <div
                    key={story.name}
                    className="flex min-w-[70px] flex-col items-center gap-1"
                  >
                    <div className="rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[2px]">
                      <Avatar className="h-16 w-16 border-2 border-background">
                        <AvatarImage src={story.image} />
                        <AvatarFallback>
                          {story.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <p className="w-full truncate text-center text-xs">
                      {story.name}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Feed Posts */}
          <div className="space-y-6">
            {isLoading && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Loading feed...
              </p>
            )}
            {isError && (
              <p className="py-12 text-center text-sm text-destructive">
                Failed to load feed.
              </p>
            )}
            {!isLoading && !isError && feed?.posts.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No posts yet — follow people to see their posts here.
              </p>
            )}
            {feed?.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden w-80 lg:block">
          <div className="sticky top-6 space-y-6">
            {/* Current User */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14">
                  <AvatarImage src="https://i.pravatar.cc/150?img=1" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">your_username</p>
                  <p className="text-sm text-muted-foreground">Your Name</p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="text-sm font-semibold text-blue-500"
              >
                Switch
              </Button>
            </div>

            {/* Suggestions — not backed by an API yet, kept as decorative mock content */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-muted-foreground">
                  Suggested for you
                </p>
                <Button variant="ghost" className="p-0 text-sm font-semibold">
                  See All
                </Button>
              </div>

              <div className="space-y-3">
                {stories.slice(1, 6).map((user) => (
                  <div
                    key={user.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image} />
                        <AvatarFallback>
                          {user.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Suggested for you
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="p-0 text-sm font-semibold text-blue-500"
                    >
                      Follow
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>About · Help · Press · API · Jobs · Privacy · Terms</p>
              <p>© 2026 YourSocial</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
