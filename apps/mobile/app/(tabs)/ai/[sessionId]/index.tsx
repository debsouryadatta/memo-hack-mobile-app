import { type Id } from "@memo-hack/convex";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { AIChatScreen } from "@/components/ai/AIChatScreen";
import { MEMO_AI_NAME } from "@/lib/aiChatShared";

function paramString(
  value: string | string[] | undefined,
): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export default function AIChatSessionScreen() {
  const router = useRouter();
  const { sessionId: sessionIdParam, title: titleParam } =
    useLocalSearchParams<{
      sessionId: string | string[];
      title?: string | string[];
    }>();

  const sessionIdRaw = paramString(sessionIdParam);
  const titleRaw = paramString(titleParam);

  React.useEffect(() => {
    if (!sessionIdRaw) {
      router.replace("/(tabs)/ai");
    }
  }, [sessionIdRaw, router]);

  if (!sessionIdRaw) {
    return null;
  }

  const sessionId = sessionIdRaw as Id<"aiChatSessions">;
  const sessionTitle =
    titleRaw && titleRaw.length > 0 ? titleRaw : `${MEMO_AI_NAME} Chat`;

  return (
    <AIChatScreen
      sessionId={sessionId}
      sessionTitle={sessionTitle}
      onBack={() => router.back()}
    />
  );
}
