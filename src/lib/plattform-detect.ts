import { Monitor, Smartphone } from "lucide-react";

export function detectPlatform(userAgent?: string | null) {
  if (!userAgent) return { name: "Unknown", icon: Monitor };

  const ua = userAgent.toLowerCase();

  if (ua.includes("iphone")) return { name: "iPhone", icon: Smartphone };
  if (ua.includes("ipad")) return { name: "iPad", icon: Smartphone };

  if (ua.includes("android")) {
    if (ua.includes("mobile")) return { name: "Android", icon: Smartphone };
    return { name: "Android Tablet", icon: Smartphone };
  }

  if (ua.includes("macintosh") || ua.includes("mac os x"))
    return { name: "macOS", icon: Monitor };
  if (ua.includes("windows nt")) return { name: "Windows", icon: Monitor };
  if (ua.includes("linux") && !ua.includes("android"))
    return { name: "Linux", icon: Monitor };
  if (ua.includes("cros")) return { name: "Chrome OS", icon: Monitor };

  return { name: "Unknown", icon: Monitor };
}
