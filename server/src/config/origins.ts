// CLIENT_URL accepts a comma-separated list, e.g.
// "https://teamrank.example.com,http://localhost:3000,http://localhost:3005".
export function getAllowedOrigins(): string[] {
  return (process.env.CLIENT_URL ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
