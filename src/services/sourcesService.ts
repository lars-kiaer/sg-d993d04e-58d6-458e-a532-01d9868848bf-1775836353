import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type NewsSource = Database["public"]["Tables"]["news_sources"]["Row"];
export type NewsSourceInsert = Database["public"]["Tables"]["news_sources"]["Insert"];
export type NewsSourceUpdate = Database["public"]["Tables"]["news_sources"]["Update"];

export type SearchHistory = Database["public"]["Tables"]["search_history"]["Row"];
export type SearchHistoryInsert = Database["public"]["Tables"]["search_history"]["Insert"];
export type SearchHistoryUpdate = Database["public"]["Tables"]["search_history"]["Update"];

export const sourcesService = {
  async getSourcesByLocation(country: string, zipCode: string): Promise<NewsSource[]> {
    const { data, error } = await supabase
      .from("news_sources")
      .select("*")
      .eq("country", country)
      .eq("zip_code", zipCode)
      .order("community_importance", { ascending: false });

    console.log("Get sources by location:", { data, error, country, zipCode });
    if (error) throw error;
    return data || [];
  },

  async createSource(source: NewsSourceInsert): Promise<NewsSource> {
    const { data, error } = await supabase
      .from("news_sources")
      .insert(source)
      .select()
      .single();

    console.log("Create source:", { data, error });
    if (error) throw error;
    return data;
  },

  async updateSource(id: string, updates: NewsSourceUpdate): Promise<NewsSource> {
    const { data, error } = await supabase
      .from("news_sources")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    console.log("Update source:", { data, error });
    if (error) throw error;
    return data;
  },

  async deleteSource(id: string): Promise<void> {
    const { error } = await supabase
      .from("news_sources")
      .delete()
      .eq("id", id);

    console.log("Delete source:", { error });
    if (error) throw error;
  },

  async createSearchHistory(country: string, zipCode: string, userId?: string): Promise<SearchHistory> {
    const { data, error } = await supabase
      .from("search_history")
      .insert({
        country,
        zip_code: zipCode,
        user_id: userId || null,
        status: "pending",
      })
      .select()
      .single();

    console.log("Create search history:", { data, error });
    if (error) throw error;
    return data;
  },

  async updateSearchHistory(
    id: string,
    updates: SearchHistoryUpdate
  ): Promise<SearchHistory> {
    const { data, error } = await supabase
      .from("search_history")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    console.log("Update search history:", { data, error });
    if (error) throw error;
    return data;
  },

  async getSearchHistory(userId?: string): Promise<SearchHistory[]> {
    let query = supabase
      .from("search_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;
    console.log("Get search history:", { data, error });
    if (error) throw error;
    return data || [];
  },
};