import { useState } from "react";
import { SEO } from "@/components/SEO";
import { SearchForm } from "@/components/SearchForm";
import { ResultsTable } from "@/components/ResultsTable";
import { sourcesService, type NewsSource } from "@/services/sourcesService";
import { useToast } from "@/hooks/use-toast";
import { Newspaper } from "lucide-react";

export default function Home() {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (country: string, zipCode: string) => {
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      // Create search history entry
      await sourcesService.createSearchHistory(country, zipCode);
      
      // Fetch sources for this location
      const results = await sourcesService.getSourcesByLocation(country, zipCode);
      setSources(results);
      
      if (results.length === 0) {
        toast({
          title: "No sources found",
          description: `No local news sources found for ${zipCode}, ${country}. The investigator will begin research soon.`,
        });
      } else {
        toast({
          title: "Sources discovered",
          description: `Found ${results.length} local news sources in your area.`,
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: "Unable to search for news sources. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="Local News Source Discovery Platform"
        description="Automatically discover and categorize all local news sources for any location worldwide"
      />
      
      <div className="min-h-screen bg-background">
        <div className="container py-12 space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
              <Newspaper className="w-8 h-8 text-accent" />
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight">
              Local News Source Discovery
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Enter a country and zip code to discover all local news sources — businesses, organizations, 
              community bodies, municipalities, and more, automatically categorized and scored.
            </p>
          </div>

          {/* Search Form */}
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />

          {/* Results */}
          {hasSearched && !isLoading && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-2xl font-semibold">
                  Discovered Sources
                </h2>
              </div>
              <ResultsTable sources={sources} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}