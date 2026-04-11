export default {
  providers: [
    {
      // Convex site URL is used as the OIDC issuer.
      // The /.well-known/openid-configuration and /.well-known/jwks.json
      // endpoints are served from http.ts using the RS256 public key.
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "memohack",
    },
  ],
};
