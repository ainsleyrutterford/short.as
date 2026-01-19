"use client";

import React, { useState } from "react";
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
import { top50, regions, countries } from "@short-as/shared";
import { Separator } from "@/components/ui/separator";
import { useGetUrlViews } from "@/queries/urls";

type FilterType = "Country" | "Region" | "Device" | "Referer";

interface Filter {
  type: FilterType;
  value: string;
}

const FilterIcon = ({ type, value }: { type: string; value: string }) => {
  const sizeClass = "h-3.5 w-3.5";
  if (type === "Country") {
    return <span className={`fi fi-${value.toLowerCase()} fis rounded-full ${sizeClass}`} />;
  }
  if (type === "Device") {
    const icons: Record<string, React.ReactNode> = {
      iOS: <SiApple className={sizeClass} />,
      Android: <SiAndroid className={sizeClass} />,
      Tablet: <Tablet className={sizeClass} />,
      Desktop: <Monitor className={sizeClass} />,
      Other: <Ellipsis className={sizeClass} />,
    };
    return icons[value] || null;
  }
  if (type === "Referer") {
    const icons: Record<string, React.ReactNode> = {
      Direct: <MousePointerClick className={sizeClass} />,
      Google: <SiGoogle className={sizeClass} />,
      Bing: <Search className={sizeClass} />,
      Facebook: <SiFacebook className={sizeClass} />,
      Twitter: <SiX className={sizeClass} />,
      LinkedIn: <SiLinkedin className={sizeClass} />,
      YouTube: <SiYoutube className={sizeClass} />,
      Instagram: <SiInstagram className={sizeClass} />,
      TikTok: <SiTiktok className={sizeClass} />,
      Reddit: <SiReddit className={sizeClass} />,
      Other: <Ellipsis className={sizeClass} />,
    };
    return icons[value] || null;
  }
  return null;
};

const CountrySubMenu = ({ addFilter }: { addFilter: (value: string) => void }) => {
  const countryList = Array.from(top50).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Flag className="h-4 w-4 mr-2" />
        Country
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="p-0">
          <div className="max-h-64 pl-1 py-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
            {countryList.map((country) => (
              <DropdownMenuItem key={country.alpha} onSelect={() => addFilter(country.alpha)}>
                <FilterIcon type="Country" value={country.alpha} />
                <span className="pl-2">{country.name.split(",")[0]}</span>
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
};

const RegionSubMenu = ({ addFilter }: { addFilter: (value: string) => void }) => (
  <DropdownMenuSub>
    <DropdownMenuSubTrigger>
      <MapPinned className="h-4 w-4 mr-2" />
      Region
    </DropdownMenuSubTrigger>
    <DropdownMenuPortal>
      <DropdownMenuSubContent>
        {regions.map((region) => (
          <DropdownMenuItem key={region} onSelect={() => addFilter(region)}>
            {region}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onSelect={() => addFilter("Other")}>Other</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuPortal>
  </DropdownMenuSub>
);

const DeviceSubMenu = ({ addFilter }: { addFilter: (value: string) => void }) => (
  <DropdownMenuSub>
    <DropdownMenuSubTrigger>
      <MonitorSmartphone className="h-4 w-4 mr-2" />
      Device
    </DropdownMenuSubTrigger>
    <DropdownMenuPortal>
      <DropdownMenuSubContent>
        {["iOS", "Android", "Tablet", "Desktop", "Other"].map((device) => (
          <DropdownMenuItem key={device} onSelect={() => addFilter(device)}>
            <FilterIcon type="Device" value={device} />
            <span className="ml-2">{device}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuPortal>
  </DropdownMenuSub>
);

const ReferrerSubMenu = ({ addFilter }: { addFilter: (value: string) => void }) => (
  <DropdownMenuSub>
    <DropdownMenuSubTrigger>
      <Link2 className="h-4 w-4 mr-2" />
      Referrer
    </DropdownMenuSubTrigger>
    <DropdownMenuPortal>
      <DropdownMenuSubContent>
        {[
          "Direct",
          "Google",
          "Bing",
          "Facebook",
          "Twitter",
          "LinkedIn",
          "YouTube",
          "Instagram",
          "TikTok",
          "Reddit",
          "Other",
        ].map((referrer) => (
          <DropdownMenuItem key={referrer} onSelect={() => addFilter(referrer)}>
            <FilterIcon type="Referer" value={referrer} />
            <span className="ml-2">{referrer}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuPortal>
  </DropdownMenuSub>
);

const FilterDropdown = ({
  filters,
  setFilters,
}: {
  filters: Filter[];
  setFilters: React.Dispatch<React.SetStateAction<Filter[]>>;
}) => {
  const addFilter = (type: FilterType) => (value: string) =>
    setFilters((prev) => {
      if (prev.find((x) => x.type == type && x.value == value)) return prev;
      return [...prev, { type, value }];
    });

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
        <CountrySubMenu addFilter={addFilter("Country")} />
        <RegionSubMenu addFilter={addFilter("Region")} />
        <DropdownMenuSeparator />
        <DeviceSubMenu addFilter={addFilter("Device")} />
        <DropdownMenuSeparator />
        <ReferrerSubMenu addFilter={addFilter("Referer")} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const PeriodSelect = ({
  period,
  setPeriod,
}: {
  period: string;
  setPeriod: React.Dispatch<React.SetStateAction<string>>;
}) => (
  <Select value={period} onValueChange={setPeriod}>
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

const TimeseriesPage = () => {
  const today = new Date();
  const [period, setPeriod] = useState("hour");
  const [dateTimeRange, setDateTimeRange] = useState<DateTimeRange>({
    from: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6),
    to: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59),
  });
  const [filters, setFilters] = useState<Filter[]>([]);

  const views = useGetUrlViews("asdfghj", dateTimeRange.from?.toISOString(), dateTimeRange.to?.toISOString(), period);

  return (
    <PageContainer>
      <div className="flex flex-col">
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
                {filter.type === "Country"
                  ? countries[filter.value as keyof typeof countries].name?.split(",")[0] ?? "Other"
                  : filter.value}
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
        <pre className="mt-4 text-xs p-2 bg-secondary rounded-md">{JSON.stringify(views, null, 2)}</pre>
      </div>
    </PageContainer>
  );
};

export default TimeseriesPage;
