import { Mail, Share } from "lucide-react";
import { SiFacebook, SiLinkedin, SiX, SiReddit, IconType } from "@icons-pack/react-simple-icons";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import React from "react";

const sharingTitle = "Check out my short.as link!";

interface ShareOption {
  icon: IconType;
  label: string;
  getUrl: (shortUrl: string) => string;
}

const shareOptions: ShareOption[] = [
  {
    icon: SiFacebook,
    label: "Facebook",
    getUrl: (shortUrl) => `https://www.facebook.com/sharer.php?u=${shortUrl}`,
  },
  {
    icon: SiX,
    label: "Twitter",
    getUrl: (shortUrl) => `https://twitter.com/intent/tweet?url=${shortUrl}&text=${sharingTitle}&hashtags=short.as`,
  },
  {
    icon: SiLinkedin,
    label: "LinkedIn",
    getUrl: (shortUrl) => `https://www.linkedin.com/sharing/share-offsite/?url=${shortUrl}`,
  },
  {
    icon: SiReddit,
    label: "Reddit",
    getUrl: (shortUrl) => `https://reddit.com/submit?url=${shortUrl}&title=${sharingTitle}`,
  },
  {
    icon: Mail,
    label: "Email",
    getUrl: (shortUrl) => `mailto:?subject=${sharingTitle}&body=${shortUrl}`,
  },
];

const ShareDropdownMenuItem = ({ icon: Icon, label, url }: { icon: IconType; label: string; url: string }) => (
  <a href={url}>
    <DropdownMenuItem className="cursor-pointer">
      <Icon className="mr-2 h-4 w-4" />
      <span>{label}</span>
    </DropdownMenuItem>
  </a>
);

const ShareDrawerButton = ({ icon: Icon, label, url }: { icon: IconType; label: string; url: string }) => (
  <Button
    asChild
    type="submit"
    variant="ghost"
    style={{ justifyContent: "flex-start" }}
    className="px-2 mx-2 active:bg-muted/50"
  >
    <a href={url}>
      <Icon className="mr-2 h-4 w-4" />
      <span>{label}</span>
    </a>
  </Button>
);

interface ShareMenuContentProps {
  shortUrl: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  isTooltipAllowed: boolean;
  setIsTooltipAllowed: (allowed: boolean) => void;
}

const DesktopShareMenu = ({
  shortUrl,
  open,
  setOpen,
  isTooltipAllowed,
  setIsTooltipAllowed,
}: ShareMenuContentProps) => (
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
            <Share className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
      </TooltipTrigger>
      {isTooltipAllowed && (
        <TooltipContent>
          <p>Share short.as link</p>
        </TooltipContent>
      )}
    </Tooltip>
    <DropdownMenuContent className="w-56">
      <DropdownMenuLabel>Share</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        {shareOptions.map((option) => (
          <ShareDropdownMenuItem
            key={option.label}
            icon={option.icon}
            label={option.label}
            url={option.getUrl(shortUrl)}
          />
        ))}
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
);

const MobileShareMenu = ({ shortUrl, open, setOpen, isTooltipAllowed, setIsTooltipAllowed }: ShareMenuContentProps) => (
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
            <Share className="h-4 w-4" />
          </Button>
        </DrawerTrigger>
      </TooltipTrigger>
      {isTooltipAllowed && (
        <TooltipContent>
          <p>Share short.as link</p>
        </TooltipContent>
      )}
    </Tooltip>
    <DrawerContent>
      <div style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <DrawerHeader className="text-left">
          <DrawerTitle>Share</DrawerTitle>
        </DrawerHeader>
        <div className="grid items-start gap-1">
          {shareOptions.map((option) => (
            <ShareDrawerButton
              key={option.label}
              icon={option.icon}
              label={option.label}
              url={option.getUrl(shortUrl)}
            />
          ))}
        </div>
        <DrawerFooter className="pt-2" />
      </div>
    </DrawerContent>
  </Drawer>
);

export const ShareMenu = ({ shortUrl }: { shortUrl: string }) => {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useIsDesktop();

  // Uses state to prevent the modal closing from making the QR code tooltip reappear
  // https://github.com/radix-ui/primitives/issues/617#issuecomment-2067420500
  const [isTooltipAllowed, setIsTooltipAllowed] = React.useState(true);

  const menuProps = {
    shortUrl,
    open,
    setOpen,
    isTooltipAllowed,
    setIsTooltipAllowed,
  };

  return isDesktop ? <DesktopShareMenu {...menuProps} /> : <MobileShareMenu {...menuProps} />;
};
