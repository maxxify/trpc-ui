import {
  ChevronLeft,
  ChevronRight,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";

export function Chevron({
  className,
  direction,
}: {
  className?: string;
  direction: "up" | "down" | "right" | "left";
}) {
  switch (direction) {
    case "up":
      return <ExpandLess className={className} />;
    case "down":
      return <ExpandMore className={className} />;
    case "right":
      return <ChevronRight className={className} />;
    case "left":
      return <ChevronLeft className={className} />;
  }
}
