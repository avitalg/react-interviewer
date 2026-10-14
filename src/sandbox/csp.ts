/** iframe `sandbox` value. No allow-same-origin: user code gets an opaque origin. */
export const SANDBOX_PERMISSIONS = "allow-scripts allow-modals";

/**
 * Applied to the sandbox document via HTTP headers (and a matching meta tag).
 * `sandbox` in CSP is header-only; the meta tag repeats the rest as a fallback.
 */
export const SANDBOX_CSP_DIRECTIVES = [
  `sandbox ${SANDBOX_PERMISSIONS}`,
  "default-src 'none'",
  "script-src 'self' 'unsafe-eval'",
  "style-src 'unsafe-inline'",
  "img-src data: blob:",
  "connect-src 'none'",
  "font-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-src 'none'",
  "child-src 'none'",
  "worker-src 'none'",
  "media-src 'none'",
  "manifest-src 'none'",
] as const;

export const SANDBOX_CSP = SANDBOX_CSP_DIRECTIVES.join("; ");

/** Meta tags cannot set the CSP `sandbox` directive. */
export const SANDBOX_CSP_META = SANDBOX_CSP_DIRECTIVES.filter((directive) => !directive.startsWith("sandbox ")).join("; ");

export const SANDBOX_PERMISSIONS_POLICY =
  "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), midi=(), display-capture=(), fullscreen=(), publickey-credentials-get=(), clipboard-read=(), clipboard-write=()";
