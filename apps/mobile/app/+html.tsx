import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

/**
 * Web-only: root HTML for static export and dev web.
 * Tunes viewport (notches, pinch-zoom), theme color for browser chrome, and
 * body background to reduce flash before RN paints.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover"
        />
        <meta name="theme-color" content="#4F46E5" />
        <meta
          name="description"
          content="Memo Hack — JEE & NEET prep with chapters, practice, and an AI tutor."
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #f8fafc;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #0f172a;
  }
}
`;
