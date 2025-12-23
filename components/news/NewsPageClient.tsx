"use client";

import React from "react";

import { FiltersPanel, type Filters } from "./FiltersPanel";
import { NewsHero } from "./Hero";
import { NewsFeed } from "./NewsFeed";
import { RightRail } from "./RightRail";

export function NewsPageClient({ locale }: { locale: "zh" | "en" }) {
  const [filters, setFilters] = React.useState<Filters>({
    category: "all",
    importance: "all",
    range: "today",
    symbol: "",
    q: ""
  });

  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen px-4 pb-10 md:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <NewsHero locale={locale} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <FiltersPanel locale={locale} value={filters} onChange={setFilters} />
          </div>

          <div className="min-h-0 lg:col-span-6">
            <NewsFeed locale={locale} filters={filters} />
          </div>

          <div className="lg:col-span-3">
            <RightRail locale={locale} />
          </div>
        </div>
      </div>
    </div>
  );
}
