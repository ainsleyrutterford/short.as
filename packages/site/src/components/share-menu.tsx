import { Mail, Share } from "lucide-react";
import { SiFacebook, SiLinkedin, SiX, SiReddit } from "@icons-pack/react-simple-icons";

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
import { useMediaQuery } from "@/hooks/use-media-query";
import React from "react";

const sharingTitle = "Check out my short.as link!";

export const ShareMenu = ({ shortUrl }: { shortUrl: string }) => {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 640px)");

  // Uses state to prevent the modal closing from making the QR code tooltip reappear
  // https://github.com/radix-ui/primitives/issues/617#issuecomment-2067420500
  const [isTooltipAllowed, setIsTooltipAllowed] = React.useState(true);

  return isDesktop ? (
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
          <a href={`https://www.facebook.com/sharer.php?u=${shortUrl}`}>
            <DropdownMenuItem>
              <SiFacebook className="mr-2 h-4 w-4" />
              <span>Facebook</span>
            </DropdownMenuItem>
          </a>
          <a href={`https://twitter.com/intent/tweet?url=${shortUrl}&text=${sharingTitle}&hashtags=short.as`}>
            <DropdownMenuItem>
              <SiX className="mr-2 h-4 w-4" />
              <span>Twitter</span>
            </DropdownMenuItem>
          </a>
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${shortUrl}`}>
            <DropdownMenuItem>
              <SiLinkedin className="mr-2 h-4 w-4" />
              <span>LinkedIn</span>
            </DropdownMenuItem>
          </a>
          <a href={`https://reddit.com/submit?url=${shortUrl}&title=${sharingTitle}`}>
            <DropdownMenuItem>
              <SiReddit className="mr-2 h-4 w-4" />
              <span>Reddit</span>
            </DropdownMenuItem>
          </a>
          <a href={`mailto:?subject=${sharingTitle}&body=${shortUrl}`}>
            <DropdownMenuItem>
              <Mail className="mr-2 h-4 w-4" />
              <span>Email</span>
            </DropdownMenuItem>
          </a>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
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
            <Button asChild type="submit" variant="ghost" style={{ justifyContent: "flex-start" }}>
              <a href={`https://www.facebook.com/sharer.php?u=${shortUrl}`}>
                <SiFacebook className="mr-2 h-4 w-4" />
                <span>Facebook</span>
              </a>
            </Button>
            <Button asChild type="submit" variant="ghost" style={{ justifyContent: "flex-start" }}>
              <a href={`https://twitter.com/intent/tweet?url=${shortUrl}&text=${sharingTitle}&hashtags=short.as`}>
                <SiX className="mr-2 h-4 w-4" />
                <span>Twitter</span>
              </a>
            </Button>
            <Button asChild type="submit" variant="ghost" style={{ justifyContent: "flex-start" }}>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${shortUrl}`}>
                <SiLinkedin className="mr-2 h-4 w-4" />
                <span>LinkedIn</span>
              </a>
            </Button>
            <Button asChild type="submit" variant="ghost" style={{ justifyContent: "flex-start" }}>
              <a href={`https://reddit.com/submit?url=${shortUrl}&title=${sharingTitle}`}>
                <SiReddit className="mr-2 h-4 w-4" />
                <span>Reddit</span>
              </a>
            </Button>
            <Button asChild type="submit" variant="ghost" style={{ justifyContent: "flex-start" }}>
              <a href={`mailto:?subject=${sharingTitle}&body=${shortUrl}`}>
                <Mail className="mr-2 h-4 w-4" />
                <span>Email</span>
              </a>
            </Button>
          </div>
          <DrawerFooter className="pt-2" />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
