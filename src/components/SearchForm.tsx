import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2 } from "lucide-react";

interface SearchFormProps {
  onSearch: (country: string, zipCode: string) => Promise<void>;
  isLoading?: boolean;
}

export function SearchForm({ onSearch, isLoading = false }: SearchFormProps) {
  const [country, setCountry] = useState("");
  const [zipCode, setZipCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!country.trim() || !zipCode.trim()) return;
    await onSearch(country.trim(), zipCode.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country" className="text-sm font-semibold">
            Country
          </Label>
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
          <Label htmlFor="zipCode" className="text-sm font-semibold">
            Zip Code
          </Label>
          <Input
            id="zipCode"
            type="text"
            placeholder="e.g., 10001"
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
        className="w-full h-12 text-base font-semibold"
        disabled={isLoading || !country.trim() || !zipCode.trim()}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Researching Sources...
          </>
        ) : (
          <>
            <Search className="mr-2 h-5 w-5" />
            Discover Local News Sources
          </>
        )}
      </Button>
    </form>
  );
}