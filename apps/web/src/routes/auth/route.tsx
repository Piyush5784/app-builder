import * as React from "react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { GalleryVerticalEnd } from "lucide-react";

function getRandomImageUrl(): string {
  return "https://images.pexels.com/photos/36713144/pexels-photo-36713144.jpeg";
}

const DEV_QUOTES = [
  {
    quote:
      "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
    author: "Martin Fowler",
  },
  {
    quote: "First, solve the problem. Then, write the code.",
    author: "John Johnson",
  },
  {
    quote: "Simplicity is the soul of efficiency.",
    author: "Austin Freeman",
  },
  {
    quote:
      "Programs must be written for people to read, and only incidentally for machines to execute.",
    author: "Harold Abelson",
  },
  {
    quote: "The only way to go fast is to go well.",
    author: "Robert C. Martin",
  },
];

function getRandomQuote() {
  return DEV_QUOTES[Math.floor(Math.random() * DEV_QUOTES.length)];
}

function AuthLayout() {
  const [imageUrl] = React.useState(getRandomImageUrl);
  const [{ quote, author }] = React.useState(getRandomQuote);

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left panel */}
      <div className="flex h-screen flex-col bg-muted p-1">
        <div className="flex h-screen flex-col items-center justify-center rounded-xl border bg-background">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            My App
          </a>
          <div className="w-full max-w-md rounded-2xl p-8">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Right panel — random image + developer quote */}
      <div className="relative hidden h-screen lg:block">
        <img
          src={imageUrl}
          alt="Random"
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
        <blockquote className="absolute bottom-10 left-10 right-10 space-y-2 text-white">
          <p className="text-lg font-medium">&ldquo;{quote}&rdquo;</p>
          <footer className="text-sm text-white/70">— {author}</footer>
        </blockquote>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});
