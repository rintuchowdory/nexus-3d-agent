export async function webSearch(query: string): Promise<{ title: string; url: string; snippet: string }[]> {
  // In production, connect to a search API (Brave, Serper, etc.)
  // For MVP, return mock results that demonstrate the tool
  return [
    {
      title: `Search results for: ${query}`,
      url: "https://example.com/result1",
      snippet: "This is a placeholder. Configure a search API key to enable real web search.",
    },
  ];
}
