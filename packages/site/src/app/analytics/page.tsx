"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/page-container";
import {
  Ellipsis,
  Flag,
  Link2,
  ListFilterPlus,
  MapPinned,
  Monitor,
  MonitorSmartphone,
  MousePointerClick,
  Search,
  Tablet,
  Timer,
  X,
} from "lucide-react";
import {
  SiAndroid,
  SiApple,
  SiFacebook,
  SiGoogle,
  SiInstagram,
  SiLinkedin,
  SiReddit,
  SiTiktok,
  SiX,
  SiYoutube,
} from "@icons-pack/react-simple-icons";
import { DateTimeRange, DateTimeRangePicker } from "@/components/date-time-range-picker";
import { cn, scrollbarStyles } from "@/lib/utils";
import { top50, regions, countries } from "@short-as/shared";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const AnalyticsBreadcrumbs = ({ shortUrlId }: { shortUrlId?: string }) => (
  <Breadcrumb className="mb-4">
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink asChild>
          <Link href="/shorten">URLs</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink asChild>
          <Link href={`/edit?i=${shortUrlId}`}>{shortUrlId}</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>Analytics</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
);
import { useGetUrlViews } from "@/queries/urls";
import { ChartLine } from "@/components/line-chart";
import { ChartConfig } from "@/components/ui/chart";
import { ViewAggregateItem } from "@short-as/types";

type Period = "hour" | "day" | "week";

interface Filter {
  type: "Country" | "Region" | "Device" | "Referer";
  value: string;
}

const addFilter = (type: Filter["type"], value: string, setFilters: React.Dispatch<React.SetStateAction<Filter[]>>) => {
  setFilters((prev) => (prev.find((x) => x.type === type && x.value === value) ? prev : [...prev, { type, value }]));
};

const iconClass = "h-3.5 w-3.5";

const deviceConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  ios: { label: "iOS", icon: <SiApple className={iconClass} /> },
  android: { label: "Android", icon: <SiAndroid className={iconClass} /> },
  tablet: { label: "Tablet", icon: <Tablet className={iconClass} /> },
  desktop: { label: "Desktop", icon: <Monitor className={iconClass} /> },
  other: { label: "Other", icon: <Ellipsis className={iconClass} /> },
};

const refererConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  direct: { label: "Direct", icon: <MousePointerClick className={iconClass} /> },
  google: { label: "Google", icon: <SiGoogle className={iconClass} /> },
  bing: { label: "Bing", icon: <Search className={iconClass} /> },
  facebook: { label: "Facebook", icon: <SiFacebook className={iconClass} /> },
  twitter: { label: "Twitter", icon: <SiX className={iconClass} /> },
  linkedin: { label: "LinkedIn", icon: <SiLinkedin className={iconClass} /> },
  youtube: { label: "YouTube", icon: <SiYoutube className={iconClass} /> },
  instagram: { label: "Instagram", icon: <SiInstagram className={iconClass} /> },
  tiktok: { label: "TikTok", icon: <SiTiktok className={iconClass} /> },
  reddit: { label: "Reddit", icon: <SiReddit className={iconClass} /> },
  other: { label: "Other", icon: <Ellipsis className={iconClass} /> },
};

const getFilterLabel = (type: Filter["type"], value: string): string => {
  const key = value.toLowerCase();
  if (type === "Country") return countries[key.toUpperCase() as keyof typeof countries]?.name?.split(",")[0] ?? "Other";
  if (type === "Device") return deviceConfig[key]?.label ?? value;
  if (type === "Referer") return refererConfig[key]?.label ?? value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const FilterIcon = ({ type, value }: { type: Filter["type"]; value: string }) => {
  if (type === "Country") {
    return <span className={`fi fi-${value.toLowerCase()} fis rounded-full ${iconClass}`} />;
  }
  if (type === "Device") {
    return deviceConfig[value.toLowerCase()]?.icon ?? null;
  }
  if (type === "Referer") {
    return refererConfig[value.toLowerCase()]?.icon ?? null;
  }
  return null;
};

const FilterSubMenu = ({
  icon,
  label,
  className,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  className?: string;
  children: React.ReactNode;
}) => (
  <DropdownMenuSub>
    <DropdownMenuSubTrigger>
      {icon}
      {label}
    </DropdownMenuSubTrigger>
    <DropdownMenuPortal>
      <DropdownMenuSubContent className={className}>{children}</DropdownMenuSubContent>
    </DropdownMenuPortal>
  </DropdownMenuSub>
);

const CountrySubMenu = ({ addFilter }: { addFilter: (value: string) => void }) => {
  const countryList = Array.from(top50).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <FilterSubMenu icon={<Flag className="h-4 w-4 mr-2" />} label="Country" className="p-0">
      <div className={cn("max-h-64 pl-1 py-1 overflow-y-auto", scrollbarStyles)}>
        {countryList.map((country) => (
          <DropdownMenuItem key={country.alpha} onSelect={() => addFilter(country.alpha)}>
            <FilterIcon type="Country" value={country.alpha} />
            <span className="pl-2">{country.name.split(",")[0]}</span>
          </DropdownMenuItem>
        ))}
      </div>
    </FilterSubMenu>
  );
};

const RegionSubMenu = ({ addFilter }: { addFilter: (value: string) => void }) => (
  <FilterSubMenu icon={<MapPinned className="h-4 w-4 mr-2" />} label="Region">
    {regions.map((region) => (
      <DropdownMenuItem key={region} onSelect={() => addFilter(region)}>
        {region}
      </DropdownMenuItem>
    ))}
    <DropdownMenuItem onSelect={() => addFilter("Other")}>Other</DropdownMenuItem>
  </FilterSubMenu>
);

const DeviceSubMenu = ({ addFilter }: { addFilter: (value: string) => void }) => (
  <FilterSubMenu icon={<MonitorSmartphone className="h-4 w-4 mr-2" />} label="Device">
    {Object.entries(deviceConfig).map(([key, { label, icon }]) => (
      <DropdownMenuItem key={key} onSelect={() => addFilter(key)}>
        {icon}
        <span className="ml-2">{label}</span>
      </DropdownMenuItem>
    ))}
  </FilterSubMenu>
);

const RefererSubMenu = ({ addFilter }: { addFilter: (value: string) => void }) => (
  <FilterSubMenu icon={<Link2 className="h-4 w-4 mr-2" />} label="Referrer">
    {Object.entries(refererConfig).map(([key, { label, icon }]) => (
      <DropdownMenuItem key={key} onSelect={() => addFilter(key)}>
        {icon}
        <span className="ml-2">{label}</span>
      </DropdownMenuItem>
    ))}
  </FilterSubMenu>
);

const FilterDropdown = ({
  filters,
  setFilters,
}: {
  filters: Filter[];
  setFilters: React.Dispatch<React.SetStateAction<Filter[]>>;
}) => {
  const handleAddFilter = (type: Filter["type"]) => (value: string) => addFilter(type, value, setFilters);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <ListFilterPlus className="h-4 w-4" />
          <span className="hidden sm:inline ml-2">Filter</span>
          {filters.length > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground px-1">
              {filters.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onCloseAutoFocus={(e) => e.preventDefault()}>
        <CountrySubMenu addFilter={handleAddFilter("Country")} />
        <RegionSubMenu addFilter={handleAddFilter("Region")} />
        <DropdownMenuSeparator />
        <DeviceSubMenu addFilter={handleAddFilter("Device")} />
        <DropdownMenuSeparator />
        <RefererSubMenu addFilter={handleAddFilter("Referer")} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const PeriodSelect = ({
  period,
  setPeriod,
}: {
  period: Period;
  setPeriod: React.Dispatch<React.SetStateAction<Period>>;
}) => (
  <Select value={period} onValueChange={(s) => setPeriod(s as Period)}>
    <SelectTrigger className="h-8 w-auto px-2 gap-1 bg-background dark:bg-input/30" aria-label="Period">
      <Timer className="h-4 w-4" />
    </SelectTrigger>
    <SelectContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
      <SelectGroup>
        <SelectLabel>Period</SelectLabel>
        <SelectItem value="hour">Hourly</SelectItem>
        <SelectItem value="day">Daily</SelectItem>
        <SelectItem value="week">Weekly</SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
);

const generateTicks = (from: Date, to: Date, period: Period): string[] => {
  const ticks: string[] = [];
  const current = new Date(from);

  if (period === "hour") {
    current.setMinutes(0, 0, 0);
  } else if (period === "day") {
    current.setHours(0, 0, 0, 0);
  } else {
    current.setHours(0, 0, 0, 0);
    // Roll back to Monday. getDay() returns 0 for Sunday, 1 for Monday, etc.
    // (day + 6) % 7 gives how many days to subtract: Mon=0, Tue=1, ..., Sun=6
    current.setDate(current.getDate() - ((current.getDay() + 6) % 7));
  }

  while (current <= to) {
    ticks.push(current.toISOString());
    if (period === "hour") current.setHours(current.getHours() + 1);
    else if (period === "day") current.setDate(current.getDate() + 1);
    else current.setDate(current.getDate() + 7);
  }

  return ticks;
};

interface ParsedViewCount {
  country: string;
  region: string;
  device: string;
  referer: string;
  count: number;
}

/**
 * Given a `ViewAggregateItem` that looks something like:
 *
 * ```
 * {
 *   pk: "...",
 *   sk: "...",
 *   views: 42,
 *   "gb_ios_google": 12,
 *   "de_android_google": 9,
 *   "europe_ios_direct": 21,
 * }
 * ```
 *
 * this function parses the view count attributes into structured data.
 * View count attributes on the DDB item look like "country_device_referer", so they all have two underscores.
 */
const parseViewCounts = (viewAggregate: ViewAggregateItem): ParsedViewCount[] =>
  Object.entries(viewAggregate)
    .filter(([key, value]) => key.split("_").length - 1 === 2 && typeof value === "number" && Number.isFinite(value))
    .map(([key, value]) => {
      const [countryOrRegion, device, referer] = key.split("_");
      const isRegion = regions.map((r) => r.toLowerCase()).includes(countryOrRegion);
      return {
        country: isRegion ? "other" : countryOrRegion,
        region: isRegion
          ? countryOrRegion
          : countries[countryOrRegion.toUpperCase() as keyof typeof countries]?.region?.toLowerCase() ?? "other",
        device: device ?? "other",
        referer: referer ?? "other",
        count: value as number,
      };
    });

const applyFilters = (parsed: ParsedViewCount[], filters: Filter[]): ParsedViewCount[] => {
  if (filters.length === 0) return parsed;

  const countryFilters = filters.filter(({ type }) => type === "Country").map(({ value }) => value.toLowerCase());
  const regionFilters = filters.filter(({ type }) => type === "Region").map(({ value }) => value.toLowerCase());
  const deviceFilters = filters.filter(({ type }) => type === "Device").map(({ value }) => value.toLowerCase());
  const refererFilters = filters.filter(({ type }) => type === "Referer").map(({ value }) => value.toLowerCase());

  return parsed.filter(
    (item) =>
      (countryFilters.length === 0 || countryFilters.includes(item.country)) &&
      (regionFilters.length === 0 || regionFilters.includes(item.region)) &&
      (deviceFilters.length === 0 || deviceFilters.includes(item.device)) &&
      (refererFilters.length === 0 || refererFilters.includes(item.referer)),
  );
};

/**
 * Aggregates parsed view counts by a given key.
 * Example: aggregateBy(parsed, "region") returns Map { "europe" => 33, "asia" => 12, ... }
 */
const aggregateBy = (parsed: ParsedViewCount[], key: keyof ParsedViewCount): Map<string, number> =>
  parsed.reduce((acc, item) => {
    const value = item[key] as string;
    acc.set(value, (acc.get(value) ?? 0) + item.count);
    return acc;
  }, new Map<string, number>());

const chartConfig = {
  y: {
    label: "Views",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const BreakdownCard = ({
  title,
  data,
  type,
  onFilterClick,
  isLoading,
}: {
  title: string;
  data: Map<string, number>;
  type: Filter["type"];
  onFilterClick: (value: string) => void;
  isLoading?: boolean;
}) => {
  const entries = Array.from(data.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <Card>
      <CardHeader className="py-1 sm:py-2 px-3 sm:px-4 text-sm font-medium">{title}</CardHeader>
      <Separator />
      <CardContent className="py-1 sm:py-2 px-3 sm:px-4 text-sm">
        {isLoading ? (
          <Skeleton className="h-5 w-full rounded-md my-1.5" />
        ) : entries.length === 0 ? (
          <div className="text-xs text-muted-foreground py-2">No data</div>
        ) : (
          entries.map(([key, count]) => (
            <div
              key={key}
              onClick={() => onFilterClick(key)}
              className="flex justify-between items-center py-1.5 px-2 -mx-2 rounded-md cursor-pointer hover:bg-muted active:bg-muted/70"
            >
              <div className="flex items-center gap-2">
                <FilterIcon type={type} value={key} />
                <span>{getFilterLabel(type, key)}</span>
              </div>
              <span className="text-muted-foreground">{count}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

const AnalyticsPage = () => {
  const searchParams = useSearchParams();
  const shortUrlId = searchParams.get("i");

  const today = new Date();
  const [period, setPeriod] = useState<Period>("day");
  const [dateTimeRange, setDateTimeRange] = useState<DateTimeRange>({
    from: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6),
    to: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59),
  });
  const [filters, setFilters] = useState<Filter[]>([]);

  const { data, isLoading, isError } = useGetUrlViews(
    shortUrlId ?? "",
    dateTimeRange.from?.toISOString(),
    dateTimeRange.to?.toISOString(),
    period,
  );

  React.useEffect(() => {
    if (isError) toast.error("Failed to load views for the URL");
  }, [isError]);

  const chartData = React.useMemo(() => {
    if (!dateTimeRange.from || !dateTimeRange.to) return [];

    const viewsByDate = data?.map((viewItem) => {
      const parsed = parseViewCounts(viewItem);
      const filtered = applyFilters(parsed, filters);
      return { date: viewItem.sk, views: filtered.reduce((acc, item) => acc + item.count, 0) };
    });

    const ticks = generateTicks(dateTimeRange.from, dateTimeRange.to, period);
    const viewsMap = new Map(viewsByDate?.map((v) => [v.date, v.views]) ?? []);
    return ticks.map((t) => ({ x: t, y: viewsMap.get(t) ?? 0 }));
  }, [dateTimeRange, period, data, filters]);

  const breakdowns = React.useMemo(() => {
    const allViewCounts = data?.flatMap(parseViewCounts) ?? [];
    const filteredViewCounts = applyFilters(allViewCounts, filters);
    return {
      region: aggregateBy(filteredViewCounts, "region"),
      country: aggregateBy(filteredViewCounts, "country"),
      device: aggregateBy(filteredViewCounts, "device"),
      referer: aggregateBy(filteredViewCounts, "referer"),
    };
  }, [data, filters]);

  return (
    <PageContainer>
      <div className="flex flex-col">
        <AnalyticsBreadcrumbs shortUrlId={shortUrlId ?? undefined} />
        <div className="flex flex-row justify-between gap-2">
          <FilterDropdown filters={filters} setFilters={setFilters} />
          <div className="flex flex-row gap-2">
            <DateTimeRangePicker value={dateTimeRange} onChange={setDateTimeRange} />
            <PeriodSelect period={period} setPeriod={setPeriod} />
          </div>
        </div>
        {filters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {filters.map((filter) => (
              <div
                key={`${filter.type}-${filter.value}`}
                className="flex items-center border rounded-md text-sm gap-2 pr-1"
              >
                <span className="text-muted-foreground pl-2.5 py-1">{filter.type} is</span>
                <Separator orientation="vertical" />
                <FilterIcon type={filter.type} value={filter.value} />
                {getFilterLabel(filter.type, filter.value)}
                <Button
                  size="smallIcon"
                  variant="ghost"
                  className="-ml-1"
                  onClick={() =>
                    setFilters((prev) => prev.filter((x) => x.type !== filter.type || x.value !== filter.value))
                  }
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className="my-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-4 sm:p-5">
                <Skeleton className="aspect-video w-full" />
              </CardContent>
            </Card>
          ) : (
            <ChartLine chartData={chartData} chartConfig={chartConfig} period={period} />
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          <BreakdownCard
            title="Region"
            data={breakdowns.region}
            type="Region"
            onFilterClick={(v) => addFilter("Region", v, setFilters)}
            isLoading={isLoading}
          />
          <BreakdownCard
            title="Country"
            data={breakdowns.country}
            type="Country"
            onFilterClick={(v) => addFilter("Country", v, setFilters)}
            isLoading={isLoading}
          />
          <BreakdownCard
            title="Device"
            data={breakdowns.device}
            type="Device"
            onFilterClick={(v) => addFilter("Device", v, setFilters)}
            isLoading={isLoading}
          />
          <BreakdownCard
            title="Referer"
            data={breakdowns.referer}
            type="Referer"
            onFilterClick={(v) => addFilter("Referer", v, setFilters)}
            isLoading={isLoading}
          />
        </div>
      </div>
    </PageContainer>
  );
};

export default function Analytics() {
  return (
    <Suspense>
      <AnalyticsPage />
    </Suspense>
  );
}
