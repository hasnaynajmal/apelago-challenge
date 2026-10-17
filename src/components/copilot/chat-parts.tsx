"use client";

// Custom piece for the Ask Atlas chat: a shimmering "Thinking…" line while the model reasons (hidden once the
// answer starts), replacing CopilotKit's "Thought for N seconds" rows.
import { CopilotChatReasoningMessage } from "@copilotkit/react-core/v2";
import { Sparkles } from "lucide-react";

type ReasoningProps = React.ComponentProps<typeof CopilotChatReasoningMessage>;

function Thinking({ isRunning, isLatest, messages, message }: ReasoningProps) {
  const latest = isLatest ?? messages?.[messages.length - 1]?.id === message.id;
  if (!isRunning || !latest) return <></>;
  return <ThinkingLine label="Thinking…" />;
}

/** Shimmering status line used while Atlas thinks or a tool runs. */
export function ThinkingLine({ label }: { label: string }) {
  return (
    <div className="my-2 flex items-center gap-2 text-[13px]">
      <Sparkles className="size-3.5 animate-pulse text-navy" />
      <span className="shimmer-text font-medium">{label}</span>
    </div>
  );
}

// The slot expects the component's static parts too.
export const ThinkingSlot = Object.assign(Thinking, {
  Header: CopilotChatReasoningMessage.Header,
  Content: CopilotChatReasoningMessage.Content,
  Toggle: CopilotChatReasoningMessage.Toggle,
});
