import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SearchFormProps {
  onSearchComplete: (sources: any[]) => void;
}

export function SearchForm({ onSearchComplete }: SearchFormProps) {
  const [country, setCountry] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!country.trim() || !zipCode.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both country and zip code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/discover-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, zipCode }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to discover sources");
      }

      toast({
        title: "Discovery complete!",
        description: `Found ${data.sources?.length || 0} local news sources`,
      });

      onSearchComplete(data.sources || []);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            type="text"
            placeholder="e.g., United States"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            disabled={isLoading}
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zipCode">Zip Code</Label>
          <Input
            id="zipCode"
            type="text"
            placeholder="e.g., 90210"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            disabled={isLoading}
            className="h-12"
          />
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={isLoading}
        className="w-full h-12 text-base font-semibold"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Discovering Sources...
          </>
        ) : (
          <>
            <Search className="mr-2 h-5 w-5" />
            Discover Local News Sources
          </>
        )}
      </Button>

      {isLoading && (
        <div className="text-sm text-muted-foreground text-center space-y-1">
          <p>Searching web sources...</p>
          <p>Querying Google Places...</p>
          <p>Analyzing with AI...</p>
        </div>
      )}
    </form>
  );
}