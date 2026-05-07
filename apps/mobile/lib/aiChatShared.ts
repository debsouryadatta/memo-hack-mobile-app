import type { Doc } from "@memo-hack/convex";

/** Taller minimum so a single-line placeholder fits on Android (font + padding). */
export const COMPOSER_MIN_HEIGHT = 52;
export const COMPOSER_MAX_HEIGHT = 112;
export const MEMO_AI_NAME = "Memo AI";

export type ChatMessageRow = Doc<"aiChatMessages"> & { imageUrl?: string | null };

export const aiMarkdownStyles = {
  body: {
    color: "#1E293B",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 0,
    marginBottom: 0,
  },
  paragraph: { marginTop: 0, marginBottom: 8 },
  heading1: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 0,
    marginBottom: 8,
  },
  heading2: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 0,
    marginBottom: 6,
  },
  heading3: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 0,
    marginBottom: 6,
  },
  strong: { color: "#0F172A", fontWeight: "800" },
  em: { color: "#334155", fontStyle: "italic" },
  bullet_list: { marginTop: 0, marginBottom: 8 },
  ordered_list: { marginTop: 0, marginBottom: 8 },
  list_item: { marginBottom: 4 },
  code_inline: {
    backgroundColor: "#E2E8F0",
    color: "#1E293B",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  fence: {
    backgroundColor: "#0F172A",
    color: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  math_inline: {
    backgroundColor: "#F1F5F9",
    color: "#0F172A",
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    fontWeight: "700",
  },
  math_block: {
    marginTop: 4,
    marginBottom: 10,
  },
  math_block_scroll: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
  },
  math_block_content: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  math_block_text: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
  },
} as const;

export const userMarkdownStyles = {
  body: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 0,
    marginBottom: 0,
  },
  paragraph: { marginTop: 0, marginBottom: 8 },
  heading1: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 0,
    marginBottom: 6,
  },
  heading2: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 0,
    marginBottom: 6,
  },
  heading3: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 0,
    marginBottom: 4,
  },
  strong: { color: "#FFFFFF", fontWeight: "800" },
  em: { color: "#E0E7FF", fontStyle: "italic" },
  bullet_list: { marginTop: 0, marginBottom: 8 },
  ordered_list: { marginTop: 0, marginBottom: 8 },
  list_item: { marginBottom: 4 },
  code_inline: {
    backgroundColor: "rgba(255,255,255,0.2)",
    color: "#FFFFFF",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  fence: {
    backgroundColor: "rgba(15,23,42,0.55)",
    color: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  math_inline: {
    backgroundColor: "rgba(255,255,255,0.18)",
    color: "#FFFFFF",
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    fontWeight: "700",
  },
  math_block: {
    marginTop: 4,
    marginBottom: 10,
  },
  math_block_scroll: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "rgba(255,255,255,0.24)",
    borderRadius: 12,
    borderWidth: 1,
  },
  math_block_content: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  math_block_text: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
  },
} as const;

export function isAuthRequiredError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const err = error as {
    code?: string;
    data?: { code?: string; message?: string };
    message?: string;
  } | null;
  const code = err?.data?.code ?? err?.code;
  const dataMessage = err?.data?.message ?? err?.message;
  return (
    code === "AUTH_REQUIRED" ||
    message.includes("AUTH_REQUIRED") ||
    message.includes("Authentication required") ||
    (typeof dataMessage === "string" &&
      dataMessage.includes("Authentication required"))
  );
}

export function getUsageLimitMessage(error: unknown): string | null {
  const err = error as {
    code?: string;
    data?: { code?: string; message?: string };
    message?: string;
  } | null;

  const code = err?.data?.code ?? err?.code;
  const message = err?.data?.message ?? err?.message ?? "";

  if (code === "LIMIT_REACHED" || code === "RATE_LIMITED") {
    return message || "Your AI limit is reached. Please try again later.";
  }

  return null;
}
