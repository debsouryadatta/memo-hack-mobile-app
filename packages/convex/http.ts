import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, streamText, UIMessage } from "ai";
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

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
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }),
});

http.route({
  path: "/.well-known/jwks.json",
  method: "GET",
  handler: httpAction(async (_ctx, _req) => {
    // JWT_PUBLIC_KEY_N is the base64url-encoded modulus of the RSA public key.
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
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }),
});

// ── AI Chat streaming ─────────────────────────────────────────────────────

http.route({
  path: "/api/chat",
  method: "POST",
  handler: httpAction(async (_ctx, request) => {
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
