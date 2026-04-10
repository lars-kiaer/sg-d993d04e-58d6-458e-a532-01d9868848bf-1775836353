interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

interface PlaceResult {
  displayName?: { text: string };
  formattedAddress?: string;
  websiteUri?: string;
  types?: string[];
  rating?: number;
  userRatingCount?: number;
}

interface DiscoveredSource {
  name: string;
  url: string;
  description: string;
  sourceType: string;
  location?: string;
}

export const crawlerService = {
  /**
   * Perform Google Custom Search for local news sources
   */
  async searchLocalNews(country: string, zipCode: string): Promise<DiscoveredSource[]> {
    const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    const engineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

    if (!apiKey || !engineId) {
      console.error("Google Custom Search API credentials not configured");
      console.error("API Key present:", !!apiKey);
      console.error("Engine ID present:", !!engineId);
      throw new Error("Google Custom Search API credentials not configured");
    }

    const queries = [
      `${zipCode} local news ${country}`,
      `${zipCode} community news`,
      `${zipCode} newspaper`,
      `${zipCode} news outlets`,
    ];

    const allResults: DiscoveredSource[] = [];

    for (const query of queries) {
      const url = new URL("https://www.googleapis.com/customsearch/v1");
      url.searchParams.set("key", apiKey);
      url.searchParams.set("cx", engineId);
      url.searchParams.set("q", query);
      url.searchParams.set("num", "10");

      try {
        console.log(`Executing search query: "${query}"`);
        const response = await fetch(url.toString());
        const data = await response.json();

        console.log(`Search response status: ${response.status}`);
        console.log(`Search response data:`, JSON.stringify(data, null, 2));

        if (!response.ok) {
          console.error(`Search API error for "${query}":`, data);
          continue;
        }

        if (data.items) {
          const sources = data.items.map((item: SearchResult) => ({
            name: item.title,
            url: item.link,
            description: item.snippet,
            sourceType: "web_search",
            location: `${zipCode}, ${country}`,
          }));
          console.log(`Found ${sources.length} sources for query "${query}"`);
          allResults.push(...sources);
        } else {
          console.log(`No items found for query "${query}"`);
        }
      } catch (error) {
        console.error(`Search error for query "${query}":`, error);
      }
    }

    console.log(`Total web sources found: ${allResults.length}`);
    return allResults;
  },

  /**
   * Search Google Places API (New) for local organizations that might publish news
   */
  async searchPlaces(country: string, zipCode: string): Promise<DiscoveredSource[]> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      console.error("Google Places API key not configured");
      throw new Error("Google Places API key not configured");
    }

    const placeTypes = [
      { type: "city_hall", description: "city hall" },
      { type: "local_government_office", description: "government office" },
      { type: "school", description: "school" },
      { type: "university", description: "university" },
      { type: "library", description: "library" },
      { type: "community_center", description: "community center" },
    ];

    const allResults: DiscoveredSource[] = [];

    for (const { type, description } of placeTypes) {
      const url = "https://places.googleapis.com/v1/places:searchText";

      try {
        console.log(`Searching Places (New API) for: "${type} ${zipCode}"`);
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.websiteUri,places.types",
          },
          body: JSON.stringify({
            textQuery: `${description} ${zipCode} ${country}`,
            maxResultCount: 10,
          }),
        });

        const data = await response.json();

        console.log(`Places response status: ${response.status}`);
        console.log(`Places response for "${type}":`, JSON.stringify(data, null, 2));

        if (!response.ok) {
          console.error(`Places API error for "${type}":`, data);
          continue;
        }

        if (data.places) {
          const sources = data.places
            .filter((place: PlaceResult) => place.websiteUri)
            .map((place: PlaceResult) => ({
              name: place.displayName?.text || "Unknown",
              url: place.websiteUri || "",
              description: `${description} in ${place.formattedAddress || zipCode}`,
              sourceType: type,
              location: place.formattedAddress || `${zipCode}, ${country}`,
            }));
          console.log(`Found ${sources.length} places with websites for "${type}"`);
          allResults.push(...sources);
        } else {
          console.log(`No places found for "${type}"`);
        }
      } catch (error) {
        console.error(`Places search error for type "${type}":`, error);
      }
    }

    console.log(`Total place sources found: ${allResults.length}`);
    return allResults;
  },

  /**
   * Remove duplicate sources based on URL
   */
  deduplicateSources(sources: DiscoveredSource[]): DiscoveredSource[] {
    const seen = new Set<string>();
    return sources.filter((source) => {
      const normalizedUrl = source.url.toLowerCase().replace(/\/$/, "");
      if (seen.has(normalizedUrl)) {
        return false;
      }
      seen.add(normalizedUrl);
      return true;
    });
  },
};