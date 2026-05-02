export const AI_LIMITS = {
  // Max total chat bubbles (user + assistant) allowed in one session.
  perChatMessageCap: 50,
  // Max user sends allowed per user per UTC day.
  dailyRequestCap: 30,
  // Anti-abuse burst protection.
  perMinuteRequestCap: 8,
  // Track assistant output token estimates without affecting response latency.
  tokenTrackingEnabled: true,
} as const;
