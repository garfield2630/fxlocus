export type SourcePolicy = "full" | "excerpt_only" | "metadata_only";

export type SourceDef = {
  name: string;
  type: "rss" | "official" | "licensed_api";
  url: string;
  logo_url?: string;
  enabled: boolean;
  content_policy: SourcePolicy;
};

export const DEFAULT_SOURCES: SourceDef[] = [
  {
    name: "FXStreet News",
    type: "rss",
    url: "https://www.fxstreet.com/rss/news",
    enabled: true,
    content_policy: "excerpt_only"
  },
  {
    name: "FXStreet Analysis",
    type: "rss",
    url: "https://www.fxstreet.com/rss/analysis",
    enabled: true,
    content_policy: "excerpt_only"
  },
  {
    name: "DailyFX",
    type: "rss",
    url: "https://example.com/dailyfx/rss",
    enabled: false,
    content_policy: "excerpt_only"
  },
  {
    name: "Federal Reserve",
    type: "official",
    url: "https://example.com/fed/press",
    enabled: false,
    content_policy: "metadata_only"
  },
  {
    name: "European Central Bank",
    type: "official",
    url: "https://example.com/ecb/press",
    enabled: false,
    content_policy: "metadata_only"
  },
  {
    name: "BLS Releases",
    type: "official",
    url: "https://example.com/bls/releases",
    enabled: false,
    content_policy: "metadata_only"
  },
  {
    name: "Reuters",
    type: "licensed_api",
    url: "reuters://feed",
    enabled: false,
    content_policy: "metadata_only"
  },
  {
    name: "Bloomberg",
    type: "licensed_api",
    url: "bloomberg://feed",
    enabled: false,
    content_policy: "metadata_only"
  },
  {
    name: "Financial Times",
    type: "licensed_api",
    url: "ft://feed",
    enabled: false,
    content_policy: "metadata_only"
  },
  {
    name: "WSJ",
    type: "licensed_api",
    url: "wsj://feed",
    enabled: false,
    content_policy: "metadata_only"
  }
];
