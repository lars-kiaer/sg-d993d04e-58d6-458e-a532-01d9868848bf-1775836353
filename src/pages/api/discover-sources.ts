import type { NextApiRequest, NextApiResponse } from "next";
import { crawlerService } from "@/services/crawlerService";
import { geminiService } from "@/services/geminiService";
import { supabase } from "@/integrations/supabase/client";

interface DiscoverSourcesRequest {
  country: string;
  zipCode: string;
}

interface DiscoverSourcesResponse {
  success: boolean;
  searchId?: string;
  sources?: any[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DiscoverSourcesResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { country, zipCode } = req.body as DiscoverSourcesRequest;

    if (!country || !zipCode) {
      return res.status(400).json({ 
        success: false, 
        error: "Country and zip code are required" 
      });
    }

    // Step 1: Create search history record
    const { data: searchRecord, error: searchError } = await supabase
      .from("search_history")
      .insert({
        country,
        zip_code: zipCode,
        status: "in_progress",
      })
      .select()
      .single();

    if (searchError || !searchRecord) {
      throw new Error("Failed to create search record");
    }

    // Step 2: Discover sources from Google Custom Search
    console.log("Searching for news sources...");
    const webSources = await crawlerService.searchLocalNews(country, zipCode);

    // Step 3: Discover sources from Google Places
    console.log("Searching Google Places...");
    const placeSources = await crawlerService.searchPlaces(country, zipCode);

    // Step 4: Deduplicate
    const allSources = crawlerService.deduplicateSources([
      ...webSources,
      ...placeSources,
    ]);

    console.log(`Found ${allSources.length} unique sources`);

    if (allSources.length === 0) {
      await supabase
        .from("search_history")
        .update({ 
          status: "completed",
          sources_found: 0,
        })
        .eq("id", searchRecord.id);

      return res.status(200).json({
        success: true,
        searchId: searchRecord.id,
        sources: [],
      });
    }

    // Step 5: Analyze with Gemini
    console.log("Analyzing sources with Gemini...");
    const analyzedSources = await geminiService.analyzeSources(
      allSources,
      country,
      zipCode
    );

    // Step 6: Save to database
    const sourcesToInsert = analyzedSources.map((source) => ({
      search_id: searchRecord.id,
      name: source.name,
      url: source.url,
      source_type: source.category,
      topic_focus: source.topic_focus,
      community_importance: source.community_importance,
      news_frequency: source.news_frequency,
      description: source.description,
      country: country,
      zip_code: zipCode,
    }));

    const { data: insertedSources, error: insertError } = await supabase
      .from("news_sources")
      .insert(sourcesToInsert)
      .select();

    if (insertError) {
      console.error("Error inserting sources:", insertError);
      throw insertError;
    }

    // Step 7: Update search status
    await supabase
      .from("search_history")
      .update({
        status: "completed",
        sources_found: insertedSources?.length || 0,
      })
      .eq("id", searchRecord.id);

    console.log(`Successfully saved ${insertedSources?.length} sources`);

    return res.status(200).json({
      success: true,
      searchId: searchRecord.id,
      sources: insertedSources,
    });
  } catch (error) {
    console.error("Discovery error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}