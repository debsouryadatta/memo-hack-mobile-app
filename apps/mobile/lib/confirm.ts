export type DialogVariant =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "destructive";

export type DialogActionRole = "primary" | "secondary" | "destructive";

export type AppDialogAction = {
  label: string;
  value: boolean;
  role?: DialogActionRole;
};

export type AppDialogRequest = {
  id: number;
  title: string;
  message: string;
  variant: DialogVariant;
  actions: AppDialogAction[];
  resolve: (value: boolean) => void;
};

type DialogPresenter = (request: AppDialogRequest) => void;

let nextDialogId = 1;
let presenter: DialogPresenter | null = null;

export function setDialogPresenter(nextPresenter: DialogPresenter | null) {
  presenter = nextPresenter;
  return () => {
    if (presenter === nextPresenter) {
      presenter = null;
    }
  };
}

function inferAlertVariant(title: string): DialogVariant {
  const lowerTitle = title.toLowerCase();
  if (
    lowerTitle.includes("failed") ||
    lowerTitle.includes("error") ||
    lowerTitle.includes("could not")
  ) {
    return "error";
  }
  if (
    lowerTitle.includes("sent") ||
    lowerTitle.includes("saved") ||
    lowerTitle.includes("done") ||
    lowerTitle.includes("reset") ||
    lowerTitle.includes("changed")
  ) {
    return "success";
  }
  if (
    lowerTitle.includes("limit") ||
    lowerTitle.includes("validation") ||
    lowerTitle.includes("warning")
  ) {
    return "warning";
  }
  return "info";
}

function presentDialog(options: {
  title: string;
  message: string;
  variant: DialogVariant;
  actions: AppDialogAction[];
  fallbackValue: boolean;
}): Promise<boolean> {
  if (!presenter) {
    console.warn(`[Dialog] ${options.title}: ${options.message}`);
    return Promise.resolve(options.fallbackValue);
  }

  const activePresenter = presenter;
  return new Promise((resolve) => {
    activePresenter({
      id: nextDialogId++,
      title: options.title,
      message: options.message,
      variant: options.variant,
      actions: options.actions,
      resolve,
    });
  });
}

/** Shared in-app confirmation dialog for Expo mobile and web. */
export function confirmAsync(options: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: DialogVariant;
  confirmRole?: DialogActionRole;
}): Promise<boolean> {
  const {
    title,
    message,
    confirmLabel,
    cancelLabel = "Cancel",
    variant = "destructive",
    confirmRole = "destructive",
  } = options;

  return presentDialog({
    title,
    message,
    variant,
    fallbackValue: false,
    actions: [
      { label: cancelLabel, value: false, role: "secondary" },
      { label: confirmLabel, value: true, role: confirmRole },
    ],
  });
}

/** Shared in-app alert dialog for Expo mobile and web. */
export function alertInfo(
  title: string,
  message: string,
  variant: DialogVariant = inferAlertVariant(title),
): void {
  void presentDialog({
    title,
    message,
    variant,
    fallbackValue: true,
    actions: [{ label: "OK", value: true, role: "primary" }],
  });
}
