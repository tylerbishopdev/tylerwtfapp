import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap  text-sm font-mono ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 vintage-button text-background/60 tracing-tight font-bold",
    {
        variants: {
            variant: {
                default: "vintage-button text-background/60 pt-3.5 text-sm font-bold",
                destructive:
                    "vintage-button text-background/60 pt-3.5 text-sm font-bold",
                outline:
                    "vintage-button text-background/60 pt-3.5 text-sm font-bold",
                secondary:
                    "vintage-button text-background/60 pt-3.5 text-sm font-bold",
                ghost: "vintage-button text-background/60 pt-3.5 text-sm font-bold",
                link: "vintage-button text-background/60 pt-3.5 text-sm font-bold",
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
