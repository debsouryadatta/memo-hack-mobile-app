import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, streamText, UIMessage } from "ai";
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/api/chat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const { messages }: { messages: UIMessage[] } = await request.json();

    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    const result = streamText({
      model: openrouter.chat("openai/gpt-4o-mini"),
      system:
        "You are a helpful AI tutor for JEE and NEET students. " +
        "You help with Physics, Chemistry, Mathematics, and Biology concepts. " +
        "Give clear, concise, and accurate explanations.",
      messages: await convertToModelMessages(messages),
      onError({ error }) {
        console.error("streamText error:", error);
      },
    });

    return result.toUIMessageStreamResponse({
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "none",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),
});

// CORS preflight
http.route({
  path: "/api/chat",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, _request) => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

export default http;
