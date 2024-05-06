import * as React from "react";

import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Download, QrCode } from "lucide-react";
import ReactQRCode from "react-qr-code";

const QR_CODE_ID = "QRCode";
const FILENAME = "Short.as QRCode";

type QRCodeProps = {
  shortUrl: string;
};

const downloadAsPng = () => {
  const svg = document.getElementById(QR_CODE_ID);
  if (!svg) return;

  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const image = new Image();

  image.onload = () => {
    canvas.width = image.width;
    canvas.height = image.height;
    ctx!.drawImage(image, 0, 0);
    const pngFile = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${FILENAME}.png`;
    link.href = `${pngFile}`;
    link.click();
  };

  // Triggers the onload handler
  image.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
};

const downloadAsSvg = () => {
  const svg = document.getElementById(QR_CODE_ID);
  if (!svg) return;

  const svgData = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  const link = document.createElement("a");
  link.download = `${FILENAME}.svg`;
  link.href = svgUrl;
  link.click();
};

const StyledQRCode = ({ shortUrl }: QRCodeProps) =>
  <div style={{ backgroundColor: 'white', padding: '4px' }}>
    <ReactQRCode
    id={QR_CODE_ID}
    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
    value={shortUrl}
    />
  </div>;

export const QRCodeDrawerDialog = ({ shortUrl }: QRCodeProps) => {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 640px)")

  return isDesktop ? (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <QrCode className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[340px]">
        <DialogHeader>
          <DialogTitle>QR Code</DialogTitle>
          <DialogDescription>
            Here&apos;s a QR Code that will navigate people to your short link when scanned
          </DialogDescription>
        </DialogHeader>
        <div className="grid items-start gap-4">
          <StyledQRCode shortUrl={shortUrl} />
          <Button type="submit" onClick={downloadAsPng}>
            <Download className="mr-2 h-4 w-4" />
            PNG
          </Button>
          <Button type="submit" onClick={downloadAsSvg}>
            <Download className="mr-2 h-4 w-4" />
            SVG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  ) : (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon">
          <QrCode className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <DrawerHeader className="text-left">
          <DrawerTitle>QR Code</DrawerTitle>
          <DrawerDescription>
            Here&apos;s a QR Code that will navigate people to your short link when scanned
          </DrawerDescription>
        </DrawerHeader>
        <div className="grid items-start gap-4 px-4">
          <StyledQRCode shortUrl={shortUrl} />
          <Button type="submit" onClick={downloadAsPng}>
            <Download className="mr-2 h-4 w-4" />
            PNG
          </Button>
          <Button type="submit" onClick={downloadAsSvg}>
            <Download className="mr-2 h-4 w-4" />
            SVG
          </Button>
        </div>
        <DrawerFooter className="pt-2" />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
