"use client";

// Custom pieces for the Ask Atlas chat:
// - SmoothMarkdown: types the answer out at a calm reading pace instead of dumping streamed chunks.
// - ThinkingSlot: a shimmering "Thinking…" line while the model reasons (hidden once the answer starts).
import { useEffect, useRef, useState } from "react";
import { CopilotChatAssistantMessage, CopilotChatReasoningMessage } from "@copilotkit/react-core/v2";
import { Sparkles } from "lucide-react";

const CHARS_PER_SECOND = 90; // ~15 words per second

type MarkdownProps = React.ComponentProps<typeof CopilotChatAssistantMessage.MarkdownRenderer>;

export function SmoothMarkdown({ content, ...rest }: MarkdownProps) {
  // Already-complete messages (e.g. reopening the drawer) show at once; fresh streams type out.
  const [shown, setShown] = useState(() => (content.length > 40 ? content.length : 0));
  const target = useRef(content.length);
  useEffect(() => {
    target.current = content.length;
  }, [content]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setShown((n) => {
        if (n >= target.current) return n;
        // Catch up faster if the model is far ahead, so long answers never lag by more than ~3 s.
        const behind = target.current - n;
        const speed = Math.max(CHARS_PER_SECOND, behind / 3);
        return Math.min(target.current, n + Math.max(1, Math.round(speed * dt)));
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <CopilotChatAssistantMessage.MarkdownRenderer content={content.slice(0, Math.min(shown, content.length))} {...rest} />;
}

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
