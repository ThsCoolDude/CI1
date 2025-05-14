import * as React from "react"
import { cn } from "./utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("bg-white dark:bg-[#1e293b] rounded-2xl shadow-lg", className)} {...props} />
  )
)
Card.displayName = "Card"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

export { Card, CardContent } 