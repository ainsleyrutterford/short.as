import { Mail, Share } from "lucide-react";
import { SiFacebook, SiLinkedin, SiX } from '@icons-pack/react-simple-icons';

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
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { LinkedinShareButton } from "react-share";
import React from "react";


export const ShareMenu = ({ shortUrl }: { shortUrl: string }) => {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 640px)")

  return isDesktop ? (
    <DropdownMenu open={open} onOpenChange={(newOpen) => setOpen(newOpen)}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Share className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Share</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <SiFacebook className="mr-2 h-4 w-4" />
            <span>Facebook</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <SiX className="mr-2 h-4 w-4" />
            <span>Twitter</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <SiLinkedin className="mr-2 h-4 w-4" />
            <span>LinkedIn</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Mail className="mr-2 h-4 w-4" />
            <span>Email</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon">
          <Share className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <DrawerHeader className="text-left">
          <DrawerTitle>Share</DrawerTitle>
        </DrawerHeader>
        <div className="grid items-start gap-1">
          {/* TODO: get the share buttons working, look into react-share */}
          <Button type="submit" variant="ghost" style={{ justifyContent: "flex-start" }}>
            <SiFacebook className="mr-2 h-4 w-4" />
            <span>Facebook</span>
          </Button>
          <Button type="submit" variant="ghost" style={{ justifyContent: "flex-start" }}>
            <SiX className="mr-2 h-4 w-4" />
            <span>Twitter</span>
          </Button>
          <Button type="submit" variant="ghost" style={{ justifyContent: "flex-start" }}>
            <SiLinkedin className="mr-2 h-4 w-4" />
            <span>LinkedIn</span>
          </Button>
          <Button type="submit" variant="ghost" style={{ justifyContent: "flex-start" }}>
            <Mail className="mr-2 h-4 w-4" />
            <span>Email</span>
          </Button>
        </div>
        <DrawerFooter className="pt-2" />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
