export default {
  providers: [
    {
      // Custom JWT provider — MemoHack signs its own JWTs with JWT_SECRET.
      // The `domain` field is used as the `iss` claim to identify the provider.
      domain: "https://memohack.in",
      applicationID: "memohack",
    },
  ],
};
