// Polyfill for Hermes engine which lacks utf-16le TextDecoder support
if (typeof TextDecoder !== "undefined") {
  try {
    // Test if utf-16le is supported
    new TextDecoder("utf-16le");
  } catch (e) {
    // If not, override global TextDecoder to intercept and fallback to utf-8
    const OriginalTextDecoder = TextDecoder;
    (globalThis as any).TextDecoder = class CustomTextDecoder extends OriginalTextDecoder {
      constructor(label?: string, options?: any) {
        if (label === "utf-16le" || label === "utf-16be") {
          super("utf-8", options);
        } else {
          super(label, options);
        }
      }
    };
  }
}
