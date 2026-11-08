import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CheckCheck,
  Code2,
  Cpu,
  GitBranch,
  Layers3,
  ListFilter,
  Network,
  Settings2,
  Sparkles,
  Terminal,
  TrendingUp,
  Zap,
} from "lucide-react";

export const topicIcon: Record<string, LucideIcon> = {
  rust: Settings2,
  go: Code2,
  cpp: Code2,
  hft: TrendingUp,
  os: Terminal,
  networking: Network,
  architecture: Cpu,
  kubernetes: GitBranch,
  llms: Sparkles,
  inference: Zap,
  distributed: Network,
  databases: Layers3,
};
export const pathIcon: Record<string, LucideIcon> = {
  cpu: Cpu,
  zap: Zap,
  sparkles: Sparkles,
  network: Network,
};
export const formatIcon: Record<string, LucideIcon> = {
  choice: ListFilter,
  multi_select: CheckCheck,
  explanation: BookOpen,
  code: Code2,
  debug: Terminal,
  design: Network,
  numeric: Cpu,
};
