import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-gray-800 via-blue-500 to-blue-600 hover:from-gray-700 hover:via-blue-600 hover:to-violet-600 text-white shadow-lg hover:shadow-xl hover:scale-105 border-0 font-semibold",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border-2 border-blue-200 bg-background hover:bg-gradient-to-r hover:from-blue-50 hover:to-violet-50 hover:border-blue-300 text-blue-700 transition-all duration-300 hover:scale-105 hover:shadow-lg",
        secondary:
          "bg-gradient-to-r from-blue-600 via-violet-500 to-violet-700 hover:from-blue-700 hover:via-violet-600 hover:to-violet-800 text-white shadow-lg hover:shadow-xl hover:scale-105 border-0 font-semibold",
        ghost: "hover:bg-gradient-to-r hover:from-blue-50 hover:to-violet-50 hover:text-blue-700 transition-all duration-300 hover:scale-105",
        link: "text-blue-600 underline-offset-4 hover:underline hover:text-violet-600 transition-colors duration-200",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
