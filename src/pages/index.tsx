import { useState } from "react";
import { SEO } from "@/components/SEO";
import { SearchForm } from "@/components/SearchForm";
import { ResultsTable } from "@/components/ResultsTable";
import { Newspaper } from "lucide-react";

export default function Home() {
  const [sources, setSources] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearchComplete = (discoveredSources: any[]) => {
    setSources(discoveredSources);
    setHasSearched(true);
  };

  return (
    <>
      <SEO 
        title="Local News Discovery" 
        description="Discover local news sources for any location"
      />
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-12 max-w-5xl space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
              <Newspaper className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground tracking-tight">
              Local News Discovery
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find businesses, organizations, and community bodies that publish local news.
            </p>
          </div>

          <div className="bg-card rounded-xl border shadow-sm p-6 md:p-8">
            <SearchForm onSearchComplete={handleSearchComplete} />
          </div>

          {hasSearched && (
            <div className="space-y-6">
              <h2 className="text-2xl font-heading font-semibold">Discovery Results</h2>
              <ResultsTable sources={sources} />
            </div>
          )}
        </main>
      </div>
    </>
  );
}