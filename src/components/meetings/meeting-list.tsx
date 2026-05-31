import { History } from "lucide-react";
import { MeetingCard } from "@/components/meetings/meeting-card";
import { EmptyState } from "@/components/shared/empty-state";
import type { MeetingListItemDTO } from "@/types/meeting";

/**
 * Renders the meeting history as a responsive grid, or an empty state when the
 * user hasn't uploaded anything yet.
 */
export function MeetingList({ meetings }: { meetings: MeetingListItemDTO[] }) {
  if (meetings.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No meetings yet"
        description="Upload your first meeting recording above to generate a transcript, summary and action items."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {meetings.map((meeting) => (
        <MeetingCard key={meeting.id} meeting={meeting} />
      ))}
    </div>
  );
}
