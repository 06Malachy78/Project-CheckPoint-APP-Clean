const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "https://www.checkpoint-hub.com";
};

export default function sitemap() {
  const baseUrl = getBaseUrl();
  const lastModified = new Date();

  const routes = [
    { path: "/", changeFrequency: "daily", priority: 1.0 },
    { path: "/about", changeFrequency: "monthly", priority: 0.6 },
    { path: "/search", changeFrequency: "daily", priority: 0.9 },
    { path: "/profile", changeFrequency: "weekly", priority: 0.7 },
    { path: "/login", changeFrequency: "monthly", priority: 0.3 },
    { path: "/reset-password", changeFrequency: "monthly", priority: 0.2 },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
