import { EllipsisVertical, PencilRuler, QrCode, Copy, Trash2, MousePointerClick } from "lucide-react";

import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/copy-to-clipboard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Drawer, DrawerContent, DrawerFooter, DrawerTrigger } from "@/components/ui/drawer";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { QRCodeContent } from "./qr-code";
import { DeleteConfirmation } from "./delete-confirmation";
import { useDeleteUrl } from "@/queries/urls";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import React from "react";

interface UrlOption {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive";
  dividerAfter?: boolean;
}

interface UrlOptionsContentProps {
  shortUrl: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  isTooltipAllowed: boolean;
  setIsTooltipAllowed: (allowed: boolean) => void;
  qrOpen: boolean;
  setQrOpen: (open: boolean) => void;
  deleteConfirmOpen: boolean;
  setDeleteConfirmOpen: (open: boolean) => void;
  onConfirmDelete: () => void;
  urlOptions: UrlOption[];
}

const DesktopUrlOptions = ({
  shortUrl,
  open,
  setOpen,
  isTooltipAllowed,
  setIsTooltipAllowed,
  qrOpen,
  setQrOpen,
  deleteConfirmOpen,
  setDeleteConfirmOpen,
  onConfirmDelete,
  urlOptions,
}: UrlOptionsContentProps) => {
  return (
    <>
      <DropdownMenu
        open={open}
        onOpenChange={(newOpen) => {
          setOpen(newOpen);
          setIsTooltipAllowed(false);
        }}
      >
        <Tooltip delayDuration={250}>
          <TooltipTrigger asChild onMouseEnter={() => setIsTooltipAllowed(true)}>
            <DropdownMenuTrigger asChild>
              <Button className="z-10" variant="outline" size="icon">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          {isTooltipAllowed && (
            <TooltipContent>
              <p>URL options</p>
            </TooltipContent>
          )}
        </Tooltip>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuGroup>
            {urlOptions.map((option) => (
              <React.Fragment key={option.label}>
                <DropdownMenuItem
                  onClick={option.onClick}
                  className={
                    option.variant === "destructive"
                      ? "text-destructive hover:text-destructive focus:text-destructive cursor-pointer"
                      : "cursor-pointer"
                  }
                >
                  <option.icon className="mr-2 h-4 w-4" />
                  <span>{option.label}</span>
                </DropdownMenuItem>
                {option.dividerAfter && <DropdownMenuSeparator />}
              </React.Fragment>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <QRCodeContent shortUrl={shortUrl} open={qrOpen} onOpenChange={setQrOpen} />
      <DeleteConfirmation open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen} onConfirm={onConfirmDelete} />
    </>
  );
};

const MobileUrlOptions = ({
  shortUrl,
  open,
  setOpen,
  isTooltipAllowed,
  setIsTooltipAllowed,
  qrOpen,
  setQrOpen,
  deleteConfirmOpen,
  setDeleteConfirmOpen,
  onConfirmDelete,
  urlOptions,
}: UrlOptionsContentProps) => {
  return (
    <>
      <Drawer
        open={open}
        onOpenChange={(newOpen) => {
          setOpen(newOpen);
          setIsTooltipAllowed(false);
        }}
      >
        <Tooltip delayDuration={250}>
          <TooltipTrigger asChild onMouseEnter={() => setIsTooltipAllowed(true)}>
            <DrawerTrigger asChild>
              <Button className="z-10" variant="outline" size="icon">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DrawerTrigger>
          </TooltipTrigger>
          {isTooltipAllowed && (
            <TooltipContent>
              <p>URL options</p>
            </TooltipContent>
          )}
        </Tooltip>
        <DrawerContent>
          <div style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <div className="grid items-start gap-1 pt-4">
              {urlOptions.map((option) => (
                <React.Fragment key={option.label}>
                  <Button
                    onClick={option.onClick}
                    type="submit"
                    variant="ghost"
                    style={{ justifyContent: "flex-start" }}
                    className={`px-2 mx-2 active:bg-muted/50 ${option.variant === "destructive" ? "text-destructive hover:text-destructive active:text-destructive" : ""}`}
                  >
                    <option.icon className="mr-2 h-4 w-4" />
                    <span>{option.label}</span>
                  </Button>
                  {option.dividerAfter && <div className="my-1 border-t" />}
                </React.Fragment>
              ))}
            </div>
            <DrawerFooter className="pt-2" />
          </div>
        </DrawerContent>
      </Drawer>
      <QRCodeContent shortUrl={shortUrl} open={qrOpen} onOpenChange={setQrOpen} />
      <DeleteConfirmation open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen} onConfirm={onConfirmDelete} />
    </>
  );
};

export const UrlOptions = ({ shortUrlId }: { shortUrlId: string }) => {
  const [open, setOpen] = React.useState(false);
  const [qrOpen, setQrOpen] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const isDesktop = useIsDesktop();
  const router = useRouter();

  // Uses state to prevent the modal closing from making the QR code tooltip reappear
  // https://github.com/radix-ui/primitives/issues/617#issuecomment-2067420500
  const [isTooltipAllowed, setIsTooltipAllowed] = React.useState(true);

  const deleteUrl = useDeleteUrl();

  const shortUrl = `short.as/${shortUrlId}`;

  const handleCopy = async () => {
    await copyToClipboard(shortUrl);
    setOpen(false);
  };

  const handleQrCode = () => {
    setOpen(false);
    setQrOpen(true);
  };

  const handleDelete = () => {
    setOpen(false);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteUrl.mutate(
      { shortUrlId },
      {
        onSuccess: () => {
          toast.success("URL deleted", {
            description: "Your URL has been successfully deleted",
            duration: 3000,
          });
        },
        onError: (error) => {
          toast.error("Failed to delete URL", {
            description: "Please try again later",
            duration: 5000,
          });
          console.error(error);
        },
      },
    );
  };

  const handleEdit = () => {
    setOpen(false);
    router.push(`/edit?i=${shortUrlId}`);
  };

  const handleAnalytics = () => {
    setOpen(false);
    router.push(`/analytics?i=${shortUrlId}`);
  };

  const urlOptions: UrlOption[] = [
    {
      icon: PencilRuler,
      label: "Edit",
      onClick: handleEdit,
    },
    {
      icon: MousePointerClick,
      label: "Analytics",
      onClick: handleAnalytics,
    },
    {
      icon: QrCode,
      label: "QR code",
      onClick: handleQrCode,
    },
    {
      icon: Copy,
      label: "Copy short URL",
      onClick: handleCopy,
      dividerAfter: true,
    },
    {
      icon: Trash2,
      label: "Delete",
      onClick: handleDelete,
      variant: "destructive",
    },
  ];

  const props = {
    shortUrl,
    open,
    setOpen,
    isTooltipAllowed,
    setIsTooltipAllowed,
    qrOpen,
    setQrOpen,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    onConfirmDelete: handleConfirmDelete,
    urlOptions,
  };

  return isDesktop ? <DesktopUrlOptions {...props} /> : <MobileUrlOptions {...props} />;
};
