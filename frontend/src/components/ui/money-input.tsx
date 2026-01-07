"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

// Định nghĩa props: nhận vào value (số hoặc chuỗi) và hàm onValueChange trả về số
interface MoneyInputProps extends Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> {
  value: string | number;
  onValueChange: (value: number) => void;
}

export function MoneyInput({ className, value, onValueChange, ...props }: MoneyInputProps) {
  // Format số thành chuỗi có dấu chấm (VN)
  const formatDisplay = (val: string | number) => {
    if (val === "" || val === undefined || val === null) return "";
    const num = Number(val.toString().replace(/\D/g, ""));
    if (isNaN(num)) return "";
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  const [displayValue, setDisplayValue] = React.useState(formatDisplay(value));

  // Cập nhật khi value từ ngoài thay đổi
  React.useEffect(() => {
    setDisplayValue(formatDisplay(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\./g, ""); // Xóa dấu chấm để lấy số thô
    if (!/^\d*$/.test(rawValue)) return; // Chỉ cho phép nhập số

    const numValue = Number(rawValue);
    
    // Cập nhật hiển thị
    setDisplayValue(formatDisplay(rawValue));
    
    // Trả về số nguyên cho parent component
    onValueChange(numValue);
  };

  return (
    <Input
      type="text" // Dùng text để hiển thị được dấu chấm
      className={className}
      value={displayValue}
      onChange={handleChange}
      {...props}
    />
  );
}