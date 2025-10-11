import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    "flex min-h-[80px] w-full px-3 py-2.5 vintage-font-technical text-xs text-api-black bg-white border-2 border-[#ccc] rounded-[3px] vintage-inset-shadow transition-all duration-200 ease-in-out resize-y",
                    "focus:outline-none focus:border-ready-blue focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),0_0_0_2px_rgba(30,144,255,0.2)]",
                    "disabled:cursor-not-allowed disabled:opacity-50 disabled:resize-none",
                    "placeholder:text-ssl-gray placeholder:opacity-70",
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