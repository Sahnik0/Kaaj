import { createElement, HtmlHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextProps extends HtmlHTMLAttributes<HTMLElement> {
  as?: keyof JSX.IntrinsicElements;
}

export const Text = ({
  as = "p",
  className,
  ...props
}: TextProps) => {
  return createElement(
    as,
    {
      className: cn(
        "text-foreground",
        className
      ),
      ...props,
    }
  );
};

Text.displayName = "Text";
