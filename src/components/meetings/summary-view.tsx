import { FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";

/** Renders the GPT-generated meeting summary, or an empty state. */
export function SummaryView({ summary }: { summary: string | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {summary ? (
          <p className="whitespace-pre-line leading-relaxed text-foreground/90">
            {summary}
          </p>
        ) : (
          <EmptyState
            icon={FileText}
            title="No summary yet"
            description="The summary will appear here once processing completes."
          />
        )}
      </CardContent>
    </Card>
  );
}
