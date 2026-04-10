interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

interface PlaceResult {
  name: string;
  formatted_address?: string;
  website?: string;
  types?: string[];
  rating?: number;
  user_ratings_total?: number;
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
        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.items) {
          const sources = data.items.map((item: SearchResult) => ({
            name: item.title,
            url: item.link,
            description: item.snippet,
            sourceType: "web_search",
            location: `${zipCode}, ${country}`,
          }));
          allResults.push(...sources);
        }
      } catch (error) {
        console.error(`Search error for query "${query}":`, error);
      }
    }

    return allResults;
  },

  /**
   * Search Google Places for local organizations that might publish news
   */
  async searchPlaces(country: string, zipCode: string): Promise<DiscoveredSource[]> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      throw new Error("Google Places API key not configured");
    }

    const placeTypes = [
      "city_hall",
      "local_government_office",
      "school",
      "university",
      "library",
      "community_center",
      "chamber_of_commerce",
    ];

    const allResults: DiscoveredSource[] = [];

    for (const type of placeTypes) {
      const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
      url.searchParams.set("key", apiKey);
      url.searchParams.set("query", `${type} ${zipCode} ${country}`);

      try {
        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.results) {
          const sources = data.results
            .filter((place: PlaceResult) => place.website)
            .map((place: PlaceResult) => ({
              name: place.name,
              url: place.website || "",
              description: `${type.replace(/_/g, " ")} in ${place.formatted_address || zipCode}`,
              sourceType: type,
              location: place.formatted_address || `${zipCode}, ${country}`,
            }));
          allResults.push(...sources);
        }
      } catch (error) {
        console.error(`Places search error for type "${type}":`, error);
      }
    }

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