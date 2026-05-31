import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Shown for unknown routes and for `notFound()` (e.g. a missing meeting). */
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <SearchX className="h-7 w-7 text-muted-foreground" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">Not found</h1>
        <p className="mt-1 text-muted-foreground">
          We couldn&apos;t find the page or meeting you were looking for.
        </p>
      </div>
      <Link href="/" className={cn(buttonVariants())}>
        Back to dashboard
      </Link>
    </div>
  );
}
