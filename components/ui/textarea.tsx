import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    "flex min-h-[70px] w-full  bg-no-repeat bg-cover text-accent font-mono px-3 py-2 text-sm ring-offset-background placeholder:text-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Textarea.displayName = "Textarea"

export { Textarea }
