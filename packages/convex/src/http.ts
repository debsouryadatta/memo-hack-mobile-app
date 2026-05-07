import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, streamText, UIMessage } from "ai";
import { httpRouter } from "convex/server";
import { importJWK, jwtVerify } from "jose";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { httpAction } from "./_generated/server";

const http = httpRouter();

const CORS_ALL = { "Access-Control-Allow-Origin": "*" };

function jsonResponse(
  body: unknown,
  status: number,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_ALL,
    },
  });
}

async function verifyBearerUserId(request: Request): Promise<string | null> {
  const auth = request.headers.get("authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;

  const issuer = process.env.CONVEX_SITE_URL;
  const n = process.env.JWT_PUBLIC_KEY_N;
  if (!issuer || !n) {
    console.error("Missing CONVEX_SITE_URL or JWT_PUBLIC_KEY_N");
    return null;
  }

  try {
    const publicKey = await importJWK(
      {
        kty: "RSA",
        n,
        e: "AQAB",
        alg: "RS256",
        use: "sig",
        kid: "memohack-1",
      },
      "RS256",
    );
    const { payload } = await jwtVerify(token, publicKey, {
      issuer,
      audience: "memohack",
    });
    if (typeof payload.sub !== "string" || !payload.sub) return null;
    return payload.sub;
  } catch (e) {
    console.error("JWT verify failed:", e);
    return null;
  }
}

// ── OIDC / JWKS endpoints so Convex can verify our RS256 JWTs ─────────────

http.route({
  path: "/.well-known/openid-configuration",
  method: "GET",
  handler: httpAction(async (_ctx, _req) => {
    const issuer = process.env.CONVEX_SITE_URL!;
    return new Response(
      JSON.stringify({
        issuer,
        jwks_uri: `${issuer}/.well-known/jwks.json`,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...CORS_ALL,
        },
      },
    );
  }),
});

http.route({
  path: "/.well-known/jwks.json",
  method: "GET",
  handler: httpAction(async (_ctx, _req) => {
    const n = process.env.JWT_PUBLIC_KEY_N!;
    return new Response(
      JSON.stringify({
        keys: [
          {
            kty: "RSA",
            use: "sig",
            alg: "RS256",
            kid: "memohack-1",
            n,
            e: "AQAB",
          },
        ],
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...CORS_ALL,
        },
      },
    );
  }),
});

// ── Memo AI streaming (JWT + session ownership required) ─────────────────

http.route({
  path: "/api/chat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const userId = await verifyBearerUserId(request);
    if (!userId) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    let body: {
      messages?: UIMessage[];
      sessionId?: string;
    };
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const { messages, sessionId: rawSessionId } = body;
    if (!rawSessionId || typeof rawSessionId !== "string") {
      return jsonResponse({ error: "sessionId is required" }, 400);
    }
    if (!messages || !Array.isArray(messages)) {
      return jsonResponse({ error: "messages array is required" }, 400);
    }

    const sessionId = rawSessionId as Id<"aiChatSessions">;
    const access = await ctx.runQuery(
      internal.aiChat.assertSessionOwnerForHttp,
      { sessionId, userId },
    );
    if (!access.ok) {
      const status = access.reason === "not_found" ? 404 : 403;
      return jsonResponse(
        { error: access.reason === "not_found" ? "Not found" : "Forbidden" },
        status,
      );
    }

    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });
    let streamedAssistantText = "";
    let assistantPersisted = false;
    const persistAssistantText = async (rawText: string) => {
      if (assistantPersisted) return;
      const text = rawText.trim();
      if (!text) return;
      assistantPersisted = true;
      try {
        await ctx.runMutation(internal.aiChat.persistAssistantMessageFromHttp, {
          sessionId,
          userId,
          content: text,
        });
      } catch (e) {
        console.error("persistAssistantMessageFromHttp:", e);
      }
    };

    const result = streamText({
      model: openrouter.chat("google/gemini-3-flash-preview"),
      system:
        "You are Memo AI, a helpful study assistant for JEE and NEET students. " +
        "You help with Physics, Chemistry, Mathematics, and Biology concepts. " +
        "Give clear, concise, and accurate explanations. " +
        "Format answers in Markdown. For formulas, use inline math with $...$ and important display formulas with $$...$$ on their own lines. " +
        "Avoid raw bracket math delimiters like \\[...\\]. " +
        "When the student shares an image (diagram, problem photo, notes), read it carefully and explain what you see.",
      messages: await convertToModelMessages(messages),
      onChunk({ chunk }) {
        if (chunk.type === "text-delta") {
          streamedAssistantText += chunk.text;
        }
      },
      onError({ error }) {
        console.error("streamText error:", error);
      },
      onFinish: async (event) => {
        await persistAssistantText(event.text);
      },
      onAbort: async () => {
        await persistAssistantText(streamedAssistantText);
      },
    });

    return result.toUIMessageStreamResponse({
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "none",
        ...CORS_ALL,
      },
    });
  }),
});

http.route({
  path: "/api/chat",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, _request) => {
    return new Response(null, {
      status: 204,
      headers: {
        ...CORS_ALL,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

export default http;
