import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        business: "bg-accent/20 text-accent-foreground border border-accent/30",
        organization: "bg-primary/20 text-primary border border-primary/30",
        government: "bg-chart-2/20 text-chart-2 border border-chart-2/30",
        education: "bg-chart-4/30 text-foreground border border-chart-4/40",
        media: "bg-chart-1/20 text-chart-1 border border-chart-1/30",
        community: "bg-chart-5/20 text-chart-5 border border-chart-5/30",
        facility: "bg-muted/30 text-muted-foreground border border-muted/40",
        authority: "bg-destructive/20 text-destructive border border-destructive/30",
        club: "bg-secondary text-secondary-foreground border border-border",
        other: "bg-muted/20 text-muted-foreground border border-muted/30",
      },
    },
    defaultVariants: {
      variant: "other",
    },
  }
);

interface CategoryBadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  className?: string;
}

export function CategoryBadge({ variant, children, className }: CategoryBadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {children}
    </span>
  );
}