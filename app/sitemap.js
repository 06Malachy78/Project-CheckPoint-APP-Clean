const BASE_URL = "https://checkpoint-hub.com";

export default function sitemap() {
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
    url: `${BASE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
