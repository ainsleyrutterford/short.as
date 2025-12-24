"use client";

import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageContainer } from "@/components/page-container";
import { Globe, Timer } from "lucide-react";
import { DateTimeRange, DateTimeRangePicker } from "@/components/date-time-range-picker";

const PeriodDropdownMenu = () => {
  const [period, setPeriod] = useState("Daily");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="px-3">
          <Timer className="mr-2 h-4 w-4" />
          {period}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
        <DropdownMenuRadioGroup value={period} onValueChange={setPeriod}>
          <DropdownMenuRadioItem value="Hourly">Hourly</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="Daily">Daily</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="Weekly">Weekly</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const TimezoneDropdown = () => {
  const [timezone, setTimezone] = useState("UTC");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="px-3">
          <Globe className="mr-2 h-4 w-4" />
          {timezone}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
        <DropdownMenuRadioGroup value={timezone} onValueChange={setTimezone}>
          <DropdownMenuRadioItem value="Local">Local</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="UTC">UTC</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const TimeseriesPage = () => {
  const [dateTimeRange, setDateTimeRange] = useState<DateTimeRange | undefined>(undefined);

  return (
    <PageContainer>
      <div className="flex flex-col">
        <div className="flex flex-row justify-end gap-2">
          <DateTimeRangePicker value={dateTimeRange} onChange={setDateTimeRange} />
          <PeriodDropdownMenu />
          <TimezoneDropdown />
        </div>
        {dateTimeRange && <pre className="mt-4 text-xs">{JSON.stringify(dateTimeRange, null, 2)}</pre>}
      </div>
    </PageContainer>
  );
};

export default TimeseriesPage;
