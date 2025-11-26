import { tv } from "tailwind-variants";

export const title = tv({
  base: "tracking-tight inline font-semibold",
  variants: {
    color: {
      primary: "from-theme-primary-300 to-theme-primary-700",
      secondary: "from-theme-secondary-300 to-theme-secondary-700",
      success: "from-success-300 to-success-700",
      warning: "from-warning-300 to-warning-700",
      danger: "from-danger-300 to-danger-700",
      green: "from-success-300 to-success-700", // Alias pour maintenir la compatibilité
      foreground: "dark:from-foreground dark:to-default-400",
    },
    size: {
      sm: "text-3xl lg:text-4xl",
      md: "text-[2.3rem] lg:text-5xl",
      lg: "text-4xl lg:text-6xl",
    },
    fullWidth: {
      true: "w-full block",
    },
  },
  defaultVariants: {
    size: "md",
  },
  compoundVariants: [
    {
      color: [
        "primary",
        "secondary",
        "success",
        "warning",
        "danger",
        "green",
        "foreground",
      ],
      class: "bg-clip-text text-transparent bg-gradient-to-b",
    },
  ],
});

export const subtitle = tv({
  base: "w-full md:w-1/2 my-2 text-lg lg:text-xl text-default-600 block max-w-full",
  variants: {
    fullWidth: {
      true: "!w-full",
    },
  },
  defaultVariants: {
    fullWidth: true,
  },
});
