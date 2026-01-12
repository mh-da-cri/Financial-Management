"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

// 1. Định nghĩa kiểu dữ liệu (Type) mới, bổ sung thêm indicatorColor
type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorColor?: string;
};

function Progress({
  className,
  value,
  indicatorColor, // 2. Bóc tách (destructure) biến này ra khỏi props
  ...props
}: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props} // 3. Lúc này props đã "sạch", không còn chứa indicatorColor -> Hết lỗi DOM
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full w-full flex-1 transition-all"
        style={{ 
          transform: `translateX(-${100 - (value || 0)}%)`,
          backgroundColor: indicatorColor // 4. Áp dụng màu sắc vào đây
        }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }