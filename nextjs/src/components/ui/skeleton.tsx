import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gradient-to-r from-blue-100/50 via-blue-200/30 to-blue-100/50", className)}
      {...props}
    />
  )
}

export { Skeleton } 