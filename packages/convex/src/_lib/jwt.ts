import { importPKCS8, SignJWT } from "jose";

async function getPrivateKey() {
  const b64 = process.env.JWT_PRIVATE_KEY_B64!;
  // Convex runtime doesn't provide Node's Buffer; use web-compatible base64 decode.
  const pem = atob(b64);
  return importPKCS8(pem, "RS256");
}

/** RS256 JWT: iss = CONVEX_SITE_URL, aud = memohack, sub = Convex users doc id. */
export async function generateToken(userId: string): Promise<string> {
  const privateKey = await getPrivateKey();
  return await new SignJWT({})
    .setProtectedHeader({ alg: "RS256", kid: "memohack-1" })
    .setIssuer(process.env.CONVEX_SITE_URL!)
    .setAudience("memohack")
    .setSubject(userId)
    .setExpirationTime("1095d")
    .setIssuedAt()
    .sign(privateKey);
}
