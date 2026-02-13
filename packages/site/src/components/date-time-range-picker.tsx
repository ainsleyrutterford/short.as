"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useIsDesktop } from "@/hooks/use-is-desktop";

export interface DateTimeRange {
  from?: Date;
  to?: Date;
}

const ActionButtons = ({
  onClear,
  onCancel,
  onApply,
  applyDisabled,
}: {
  onClear: () => void;
  onCancel: () => void;
  onApply: () => void;
  applyDisabled: boolean;
}) => (
  <div className="flex justify-between gap-2">
    <Button variant="ghost" size="sm" onClick={onClear}>
      Clear
    </Button>
    <div className="flex gap-2">
      <Button variant="ghost" size="sm" onClick={onCancel}>
        Cancel
      </Button>
      <Button size="sm" onClick={onApply} disabled={applyDisabled}>
        Apply
      </Button>
    </div>
  </div>
);

const DateTimeRow = ({
  dateId,
  dateLabel,
  dateValue,
  onDateChange,
  dateError,
  timeId,
  timeLabel,
  timeValue,
  onTimeChange,
}: {
  dateId: string;
  dateLabel: string;
  dateValue: string;
  onDateChange: (value: string) => void;
  dateError: string;
  timeId: string;
  timeLabel: string;
  timeValue: string;
  onTimeChange: (value: string) => void;
}) => (
  <div className="flex flex-1 gap-2">
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={dateId} className="text-xs">
        {dateLabel}
      </Label>
      <Input
        type="text"
        id={dateId}
        placeholder="DD/MM/YYYY"
        value={dateValue}
        onChange={(e) => onDateChange(e.target.value)}
        className={`w-32 ${dateError ? "border-destructive" : ""}`}
      />
      <div className={`transition-[height] duration-300 ${dateError ? "h-5" : "h-0"}`}>
        <span
          className={`text-xs text-destructive transition-opacity duration-200 ${dateError ? "opacity-100" : "opacity-0"}`}
        >
          {dateError}
        </span>
      </div>
    </div>
    <div className="flex flex-1 flex-col gap-1.5">
      <Label htmlFor={timeId} className="text-xs">
        {timeLabel}
      </Label>
      <Input
        type="time"
        id={timeId}
        value={timeValue}
        onChange={(e) => onTimeChange(e.target.value)}
        className={timeInputClassName}
      />
    </div>
  </div>
);

const Presets = ({
  today,
  range,
  onSelect,
}: {
  today: Date;
  range?: DateRange;
  onSelect: (range: DateRange) => void;
}) => {
  const presets = [
    { label: "Today", from: today, to: today },
    { label: "Last 7 days", from: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6), to: today },
    { label: "Last 30 days", from: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29), to: today },
    { label: "Last 3 months", from: new Date(today.getFullYear(), today.getMonth() - 3, today.getDate()), to: today },
    { label: "Last 6 months", from: new Date(today.getFullYear(), today.getMonth() - 6, today.getDate()), to: today },
    { label: "Month to date", from: new Date(today.getFullYear(), today.getMonth(), 1), to: today },
    { label: "Year to date", from: new Date(today.getFullYear(), 0, 1), to: today },
  ];

  const isMatch = (preset: { from: Date; to: Date }) =>
    range?.from &&
    range?.to &&
    toDateOnly(range.from).getTime() === toDateOnly(preset.from).getTime() &&
    toDateOnly(range.to).getTime() === toDateOnly(preset.to).getTime();

  return (
    <>
      {/* Desktop: vertical list on left */}
      <div className="hidden sm:flex flex-col gap-1 p-2">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant="ghost"
            size="sm"
            className={`justify-start ${isMatch(preset) ? "bg-accent/80" : ""}`}
            onClick={() => onSelect({ from: preset.from, to: preset.to })}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      {/* Mobile: horizontal scrollable row - w-0 min-w-full prevents affecting parent width */}
      <div className="sm:hidden w-0 min-w-full">
        <div className="flex gap-2 p-2 overflow-x-auto">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              className={`whitespace-nowrap ${isMatch(preset) ? "!bg-accent" : ""}`}
              onClick={() => onSelect({ from: preset.from, to: preset.to })}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
};

const timeInputClassName =
  "appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none";

const toDateOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const formatDate = (date: Date) => `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

const parseDate = (value: string) => {
  const parts = value.split(/[-/]/);
  if (parts.length === 3) {
    const [day, month, year] = parts.map(Number);
    if (day && month && year) {
      return new Date(year, month - 1, day);
    }
  }
  return undefined;
};

const combineDateAndTime = (date: Date, time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
};

const extractTime = (date: Date) =>
  `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

const futureText = "In the future!";
const beforeStartText = "Before start date!";

export const DateTimeRangePicker = ({
  value,
  onChange,
}: {
  value?: DateTimeRange;
  onChange: (value: DateTimeRange) => void;
}) => {
  const today = new Date();
  const isDesktop = useIsDesktop();

  const [open, setOpen] = React.useState(false);
  const [range, setRange] = React.useState<DateRange | undefined>(
    value?.from || value?.to ? { from: value?.from, to: value?.to } : undefined,
  );
  const [month, setMonth] = React.useState<Date>(value?.from ?? today);
  const [startTime, setStartTime] = React.useState(value?.from ? extractTime(value.from) : "00:00");
  const [endTime, setEndTime] = React.useState(value?.to ? extractTime(value.to) : "23:59");

  const [startDateInput, setStartDateInput] = React.useState(value?.from ? formatDate(value.from) : "");
  const [endDateInput, setEndDateInput] = React.useState(value?.to ? formatDate(value.to) : "");
  const [startDateError, setStartDateError] = React.useState("");
  const [endDateError, setEndDateError] = React.useState("");

  const resetToValue = () => {
    setRange(value?.from || value?.to ? { from: value?.from, to: value?.to } : undefined);
    setStartDateInput(value?.from ? formatDate(value.from) : "");
    setEndDateInput(value?.to ? formatDate(value.to) : "");
    setStartTime(value?.from ? extractTime(value.from) : "00:00");
    setEndTime(value?.to ? extractTime(value.to) : "23:59");
    setStartDateError("");
    setEndDateError("");
  };

  const handleCancel = () => {
    resetToValue();
    setOpen(false);
  };

  const filterDateInput = (val: string) => val.replace(/[^0-9/-]/g, "");

  const validateDates = (start?: Date, end?: Date, sTime?: string, eTime?: string) => {
    const todayOnly = toDateOnly(today);
    const startOnly = start ? toDateOnly(start) : undefined;
    const endOnly = end ? toDateOnly(end) : undefined;

    const startInFuture = startOnly && startOnly > todayOnly;
    const endInFuture = endOnly && endOnly > todayOnly;
    const endBeforeStart = endOnly && startOnly && endOnly < startOnly;
    const sameDay = startOnly && endOnly && startOnly.getTime() === endOnly.getTime();
    const endTimeBeforeStartTime = sameDay && (eTime ?? endTime) < (sTime ?? startTime);

    setStartDateError(startInFuture ? futureText : "");
    setEndDateError(endInFuture ? futureText : endBeforeStart || endTimeBeforeStartTime ? beforeStartText : "");
  };

  const handleStartDateChange = (val: string) => {
    const filtered = filterDateInput(val);
    setStartDateInput(filtered);
    const date = parseDate(filtered);
    if (date && !isNaN(date.getTime())) {
      setRange((prev) => ({ from: date, to: prev?.to }));
      validateDates(date, range?.to);
    }
  };

  const handleEndDateChange = (val: string) => {
    const filtered = filterDateInput(val);
    setEndDateInput(filtered);
    const date = parseDate(filtered);
    if (date && !isNaN(date.getTime())) {
      setRange((prev) => ({ from: prev?.from, to: date }));
      validateDates(range?.from, date);
    }
  };

  const handleCalendarSelect = (newRange: DateRange | undefined) => {
    setRange(newRange);
    if (newRange?.from) setStartDateInput(formatDate(newRange.from));
    if (newRange?.to) setEndDateInput(formatDate(newRange.to));
    validateDates(newRange?.from, newRange?.to);
  };

  const handlePresetSelect = (newRange: DateRange) => {
    handleCalendarSelect(newRange);
    if (newRange.from) setMonth(newRange.from);
  };

  const handleApply = () => {
    onChange({
      from: range?.from ? combineDateAndTime(range.from, startTime) : undefined,
      to: range?.to ? combineDateAndTime(range.to, endTime) : undefined,
    });
    setOpen(false);
  };

  const handleClear = () => {
    setRange(undefined);
    setStartDateInput("");
    setStartDateError("");
    setStartTime("00:00");
    setEndDateInput("");
    setEndDateError("");
    setEndTime("23:59");
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetToValue();
    if (isOpen) setMonth(value?.from ?? today);
    setOpen(isOpen);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-48 px-3 justify-between">
          {range?.from && range?.to ? `${formatDate(range.from)} - ${formatDate(range.to)}` : "Select date range"}
          <ChevronDownIcon className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0 mx-2">
        <div className="hidden sm:flex">
          {/* Desktop presets on left */}
          <Presets today={today} range={range} onSelect={handlePresetSelect} />
          <Separator orientation="vertical" className="h-auto" />
          <div>
            <Calendar
              mode="range"
              month={month}
              onMonthChange={setMonth}
              selected={range}
              captionLayout="dropdown"
              numberOfMonths={isDesktop ? 2 : 1}
              onSelect={handleCalendarSelect}
              disabled={{ after: today }}
            />
            <Separator />
            <div className="flex flex-col gap-3 p-3">
              <div className="flex flex-row gap-3">
                <DateTimeRow
                  dateId="start-date"
                  dateLabel="Start date"
                  dateValue={startDateInput}
                  onDateChange={handleStartDateChange}
                  dateError={startDateError}
                  timeId="start-time"
                  timeLabel="Start time"
                  timeValue={startTime}
                  onTimeChange={(t) => {
                    setStartTime(t);
                    validateDates(range?.from, range?.to, t, endTime);
                  }}
                />
                <DateTimeRow
                  dateId="end-date"
                  dateLabel="End date"
                  dateValue={endDateInput}
                  onDateChange={handleEndDateChange}
                  dateError={endDateError}
                  timeId="end-time"
                  timeLabel="End time"
                  timeValue={endTime}
                  onTimeChange={(t) => {
                    setEndTime(t);
                    validateDates(range?.from, range?.to, startTime, t);
                  }}
                />
              </div>
              <ActionButtons
                onClear={handleClear}
                onCancel={handleCancel}
                onApply={handleApply}
                applyDisabled={!range?.from || !range?.to || !!startDateError || !!endDateError}
              />
            </div>
          </div>
        </div>
        {/* Mobile layout */}
        <div className="sm:hidden">
          <Calendar
            mode="range"
            month={month}
            onMonthChange={setMonth}
            selected={range}
            captionLayout="dropdown"
            numberOfMonths={1}
            onSelect={handleCalendarSelect}
            disabled={{ after: today }}
          />
          <Separator />
          <Presets today={today} range={range} onSelect={handlePresetSelect} />
          <Separator />
          <div className="flex flex-col gap-3 p-3">
            <div className="flex flex-row gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="start-time-mobile" className="text-xs">
                  Start time
                </Label>
                <Input
                  type="time"
                  id="start-time-mobile"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={timeInputClassName}
                />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="end-time-mobile" className="text-xs">
                  End time
                </Label>
                <Input
                  type="time"
                  id="end-time-mobile"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={timeInputClassName}
                />
              </div>
            </div>
            <ActionButtons
              onClear={handleClear}
              onCancel={handleCancel}
              onApply={handleApply}
              applyDisabled={!range?.from || !range?.to || !!startDateError || !!endDateError}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
