import { Cpu } from "lucide-react";
import { color, cx } from "../../shared/lib/styles";
import type { Topic } from "./model";
import { topicIcon } from "./presentation";

export function TopicMark({
  topic,
  small = false,
}: {
  topic: Topic;
  small?: boolean;
}) {
  const Icon = topicIcon[topic.id] || Cpu;
  return (
    <span
      className={cx("topic-mark", small && "small")}
      style={color(topic.color)}
    >
      {["rust", "go", "cpp"].includes(topic.id) ? (
        <b>{topic.short}</b>
      ) : (
        <Icon size={small ? 17 : 22} strokeWidth={1.6} />
      )}
    </span>
  );
}
