import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        title: "DropAgent — Multi-Retailer Snipe Alerts",
      },
      {
        name: "description",
        content:
          "Scan major retailers for TCG restocks, get phone push alerts, and race simulated checkout with a sniper agent.",
      },
      { name: "theme-color", content: "#08080a" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  component: RootShell,
});

function RootShell() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-fg antialiased">
        <AuthProvider>
          <Outlet />
          <Toaster
            theme="dark"
            position="top-center"
            toastOptions={{
              className: "!bg-elevated !border-border !text-fg !font-sans",
            }}
          />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
