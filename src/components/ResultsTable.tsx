import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/CategoryBadge";
import { Search, ArrowUpDown, ExternalLink } from "lucide-react";
import type { NewsSource } from "@/services/sourcesService";

interface ResultsTableProps {
  sources: NewsSource[];
}

type SortField = "name" | "community_importance" | "news_frequency";
type SortOrder = "asc" | "desc";

export function ResultsTable({ sources }: ResultsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("community_importance");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const uniqueTypes = useMemo(() => {
    const types = new Set(sources.map(s => s.source_type));
    return Array.from(types).sort();
  }, [sources]);

  const filteredAndSortedSources = useMemo(() => {
    let filtered = sources;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.name.toLowerCase().includes(term) ||
          s.description?.toLowerCase().includes(term) ||
          s.topic_focus?.toLowerCase().includes(term)
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(s => s.source_type === typeFilter);
    }

    return filtered.sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      if (sortField === "name") {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else if (sortField === "community_importance") {
        aVal = a.community_importance || 0;
        bVal = b.community_importance || 0;
      } else if (sortField === "news_frequency") {
        aVal = a.news_frequency || 0;
        bVal = b.news_frequency || 0;
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [sources, searchTerm, typeFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const getImportanceBadge = (score: number | null) => {
    if (!score) return null;
    if (score >= 8) return <Badge className="bg-accent text-accent-foreground">High Impact</Badge>;
    if (score >= 5) return <Badge variant="secondary">Medium Impact</Badge>;
    return <Badge variant="outline">Low Impact</Badge>;
  };

  const getFrequencyText = (frequency: number | null) => {
    if (!frequency) return "Unknown";
    if (frequency >= 20) return "Daily+";
    if (frequency >= 7) return "Weekly+";
    if (frequency >= 1) return "Monthly+";
    return "Occasional";
  };

  if (sources.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          No sources found. Try searching for a different location.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, description, or topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border rounded-md bg-background text-foreground"
        >
          <option value="all">All Types</option>
          {uniqueTypes.map(type => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                <div className="flex items-center gap-2">
                  Source Name
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Topic Focus</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("community_importance")}>
                <div className="flex items-center gap-2">
                  Importance
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("news_frequency")}>
                <div className="flex items-center gap-2">
                  Frequency
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-right">Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedSources.map((source) => (
              <TableRow key={source.id}>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-semibold">{source.name}</div>
                    {source.description && (
                      <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {source.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <CategoryBadge variant={source.source_type as any}>
                    {source.source_type}
                  </CategoryBadge>
                </TableCell>
                <TableCell>
                  {source.topic_focus ? (
                    <span className="text-sm">{source.topic_focus}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">General</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getImportanceBadge(source.community_importance)}
                    <span className="text-sm text-muted-foreground">
                      {source.community_importance || 0}/10
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{getFrequencyText(source.news_frequency)}</span>
                </TableCell>
                <TableCell className="text-right">
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-accent hover:underline"
                    >
                      Visit
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground text-center">
        Showing {filteredAndSortedSources.length} of {sources.length} sources
      </div>
    </div>
  );
}