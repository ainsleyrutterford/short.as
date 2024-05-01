import * as React from "react"

import { useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Download, QrCode } from "lucide-react"

export const QRCodeDrawerDialog = () => {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <QrCode className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
            <DialogDescription>
              Here&apos;s a QR Code that will navigate people to your short link when scanned!
            </DialogDescription>
          </DialogHeader>
          <div className="grid items-start gap-4">
            <Button type="submit">
              <Download className="mr-2 h-4 w-4" />
              PNG
            </Button>
            <Button type="submit">
              <Download className="mr-2 h-4 w-4" />
              SVG
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon">
          <QrCode className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>QR Code</DrawerTitle>
          <DrawerDescription>
            Here&apos;s a QR Code that will navigate people to your short link when scanned!
          </DrawerDescription>
        </DrawerHeader>
        <div className="grid items-start gap-4 px-4">
          <Button type="submit">
              <Download className="mr-2 h-4 w-4" />
              PNG
            </Button>
          <Button type="submit">
              <Download className="mr-2 h-4 w-4" />
              SVG
            </Button>
        </div>
        <DrawerFooter className="pt-2" />
      </DrawerContent>
    </Drawer>
  )
};
