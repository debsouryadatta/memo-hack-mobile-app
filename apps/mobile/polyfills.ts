import { Platform } from "react-native";

if (Platform.OS !== "web") {
  const setupPolyfills = async () => {
    // structuredClone is missing in some older Hermes builds
    if (!("structuredClone" in globalThis)) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const sc = require("@ungap/structured-clone");
      (globalThis as Record<string, unknown>).structuredClone = sc.default ?? sc;
    }

    // TextEncoderStream / TextDecoderStream are needed by the AI SDK streaming transport
    const { TextEncoderStream, TextDecoderStream } = await import(
      "@stardazed/streams-text-encoding"
    );
    (globalThis as Record<string, unknown>).TextEncoderStream = TextEncoderStream;
    (globalThis as Record<string, unknown>).TextDecoderStream = TextDecoderStream;
  };

  setupPolyfills();
}

export { };

