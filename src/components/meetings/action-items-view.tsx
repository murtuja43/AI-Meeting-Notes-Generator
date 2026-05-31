import { ListChecks, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import type { ActionItem } from "@/types/meeting";

const PRIORITY_VARIANT: Record<ActionItem["priority"], BadgeProps["variant"]> = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
};

/** Renders the structured action items extracted by GPT, or an empty state. */
export function ActionItemsView({ items }: { items: ActionItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="h-5 w-5" />
          Action Items
          {items.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {items.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <ul className="space-y-3">
            {items.map((item, index) => (
              <li
                key={index}
                className="flex items-start justify-between gap-3 rounded-md border p-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-snug">{item.task}</p>
                  {item.owner && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      {item.owner}
                    </p>
                  )}
                </div>
                <Badge variant={PRIORITY_VARIANT[item.priority]} className="capitalize">
                  {item.priority}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={ListChecks}
            title="No action items"
            description="Any follow-ups detected in the meeting will be listed here."
          />
        )}
      </CardContent>
    </Card>
  );
}
