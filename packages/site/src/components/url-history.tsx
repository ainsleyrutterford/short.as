"use client";

import { useIsDesktop } from "@/hooks/use-is-desktop";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn, scrollbarStyles } from "@/lib/utils";
import { useUpdateUrl } from "@/queries/urls";
import { toast } from "sonner";
import { format } from "date-fns";
import { Url } from "@short-as/types";

interface HistoryEntry {
  timestamp: string;
  longUrl: string;
}

const HistoryList = ({ history, onRevert }: { history: HistoryEntry[]; onRevert: (longUrl: string) => void }) => (
  <div className={cn("max-h-[500px] overflow-y-auto", scrollbarStyles)}>
    {history.map((entry, index) => (
      <div
        key={entry.timestamp}
        className="flex items-start justify-between gap-4 py-3 border-b last:border-b-0 last:pb-5 px-4 sm:px-6"
      >
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{format(entry.timestamp, "PPp")}</p>
          <p className="text-sm truncate mt-0.5">{entry.longUrl}</p>
        </div>
        {index > 0 && (
          <Button variant="ghost" size="sm" className="shrink-0" onClick={() => onRevert(entry.longUrl)}>
            Revert
          </Button>
        )}
      </div>
    ))}
  </div>
);

const extractHistory = (url: Url): HistoryEntry[] => [
  ...(url.history
    ? Object.entries(url.history)
        .map(([timestamp, longUrl]) => ({ timestamp, longUrl }))
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    : []),
  { timestamp: url.createdTimestamp, longUrl: url.longUrl },
];

export const UrlHistory = ({
  open,
  onOpenChange,
  url,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: Url;
}) => {
  const isDesktop = useIsDesktop();
  const updateUrl = useUpdateUrl();

  const handleRevert = (longUrl: string) => {
    if (!url?.shortUrlId) return;
    updateUrl.mutate(
      { shortUrlId: url.shortUrlId, longUrl },
      {
        onSuccess: () => {
          toast.success("URL reverted");
          onOpenChange(false);
        },
        onError: () => toast.error("Failed to revert URL"),
      },
    );
  };

  const history = extractHistory(url);

  return isDesktop ? (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] px-0 pb-0">
        <DialogHeader className="px-6">
          <DialogTitle>URL history</DialogTitle>
        </DialogHeader>
        <HistoryList history={history} onRevert={handleRevert} />
      </DialogContent>
    </Dialog>
  ) : (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>URL history</DrawerTitle>
        </DrawerHeader>
        <HistoryList history={history} onRevert={handleRevert} />
      </DrawerContent>
    </Drawer>
  );
};
