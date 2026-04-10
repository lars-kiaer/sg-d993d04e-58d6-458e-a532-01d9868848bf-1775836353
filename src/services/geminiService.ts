interface SourceToAnalyze {
  name: string;
  url: string;
  description: string;
  sourceType: string;
  location?: string;
}

interface AnalyzedSource {
  name: string;
  url: string;
  category: string;
  topic_focus: string[];
  community_importance: number;
  news_frequency: string;
  description: string;
  location: string;
}

export const geminiService = {
  /**
   * Analyze and categorize sources using Gemini Flash 3 Preview
   */
  async analyzeSources(
    sources: SourceToAnalyze[],
    country: string,
    zipCode: string
  ): Promise<AnalyzedSource[]> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("Gemini API key not configured");
    }

    const prompt = `You are a local news source analyst. Analyze these potential news sources and categorize them.

For each source, provide:
1. category: One of [business, organization, government, education, media, community, facility, authority]
2. topic_focus: Array of 1-3 topics (e.g., ["local politics", "community events", "sports"])
3. community_importance: Score 1-10 (how important is this source to the local community?)
4. news_frequency: One of [daily, weekly, monthly, occasional, unknown]

Sources to analyze:
${sources.map((s, i) => `${i + 1}. Name: ${s.name}\n   URL: ${s.url}\n   Description: ${s.description}\n   Type: ${s.sourceType}`).join("\n\n")}

Location context: ${zipCode}, ${country}

Respond with ONLY a JSON array, no other text:
[
  {
    "index": 0,
    "category": "government",
    "topic_focus": ["local politics", "public services"],
    "community_importance": 8,
    "news_frequency": "daily"
  },
  ...
]`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 4096,
            },
          }),
        }
      );

      const data = await response.json();
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error("Gemini response missing expected structure:", data);
        return this.fallbackAnalysis(sources, country, zipCode);
      }

      const textResponse = data.candidates[0].content.parts[0].text;
      
      // Extract JSON from markdown code blocks if present
      const jsonMatch = textResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                        textResponse.match(/\[[\s\S]*\]/);
      
      if (!jsonMatch) {
        console.error("Could not extract JSON from Gemini response");
        return this.fallbackAnalysis(sources, country, zipCode);
      }

      const analysisResults = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      return sources.map((source, i) => {
        const analysis = analysisResults.find((a: any) => a.index === i) || {};
        return {
          name: source.name,
          url: source.url,
          category: analysis.category || "organization",
          topic_focus: analysis.topic_focus || ["general news"],
          community_importance: analysis.community_importance || 5,
          news_frequency: analysis.news_frequency || "unknown",
          description: source.description,
          location: source.location || `${zipCode}, ${country}`,
        };
      });
    } catch (error) {
      console.error("Gemini analysis error:", error);
      return this.fallbackAnalysis(sources, country, zipCode);
    }
  },

  /**
   * Fallback analysis when Gemini is unavailable
   */
  fallbackAnalysis(
    sources: SourceToAnalyze[],
    country: string,
    zipCode: string
  ): AnalyzedSource[] {
    return sources.map((source) => {
      // Simple categorization based on keywords
      let category = "organization";
      const lowerName = source.name.toLowerCase();
      const lowerType = source.sourceType.toLowerCase();

      if (lowerType.includes("government") || lowerName.includes("city") || lowerName.includes("town")) {
        category = "government";
      } else if (lowerType.includes("school") || lowerType.includes("university")) {
        category = "education";
      } else if (lowerName.includes("news") || lowerName.includes("press") || lowerName.includes("gazette")) {
        category = "media";
      } else if (lowerName.includes("business") || lowerName.includes("chamber")) {
        category = "business";
      } else if (lowerType.includes("community") || lowerType.includes("library")) {
        category = "community";
      }

      return {
        name: source.name,
        url: source.url,
        category,
        topic_focus: ["general news"],
        community_importance: 5,
        news_frequency: "unknown",
        description: source.description,
        location: source.location || `${zipCode}, ${country}`,
      };
    });
  },
};