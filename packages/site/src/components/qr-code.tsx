import * as React from "react";

import { useIsDesktop } from "@/hooks/use-is-desktop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Check, CodeXml, Image as ImageIcon, Pipette, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Colorful from "@uiw/react-color-colorful";
import { hsvaToHexa } from "@uiw/color-convert";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "next-themes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { FlickeringGrid } from "@/components/ui/flickering-grid";

const QR_CODE_ID = "QRCode";

const TITLE = "QR Code";
const DESCRIPTION = "Here's a QR Code that will navigate people to your short link when scanned";

interface HSVA {
  h: number;
  s: number;
  v: number;
  a: number;
}

interface QRCodeProps {
  shortUrl: string;
}

const getSvgData = () => {
  const svg = document.getElementById(QR_CODE_ID);
  if (!svg) return undefined;
  return new XMLSerializer().serializeToString(svg);
};

const downloadAsPng = (shortUrlId: string) => {
  const svgData = getSvgData();
  if (!svgData) return;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const image = new Image();

  const resolution = 1024;

  image.onload = () => {
    canvas.width = resolution;
    canvas.height = resolution;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    ctx!.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pngFile = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `QR Code ${shortUrlId}.png`;
    link.href = `${pngFile}`;
    link.click();
  };

  // Triggers the onload handler
  image.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
};

const downloadAsSvg = (shortUrlId: string) => {
  const svgData = getSvgData();
  if (!svgData) return;

  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  const link = document.createElement("a");
  link.download = `QR Code ${shortUrlId}.svg`;
  link.href = svgUrl;
  link.click();
};

const DownloadButtons = ({ shortUrl }: { shortUrl: string }) => {
  const shortUrlId = shortUrl.split("/").pop() ?? "";
  return (
    <div className="flex gap-2 mt-3">
      <Button variant="secondary" className="flex-1" onClick={() => downloadAsPng(shortUrlId)}>
        <ImageIcon className="mr-2 h-4 w-4" />
        PNG
      </Button>
      <Button variant="secondary" className="flex-1" onClick={() => downloadAsSvg(shortUrlId)}>
        <CodeXml className="mr-2 h-4 w-4" />
        SVG
      </Button>
    </div>
  );
};

const PRESET_COLORS: HSVA[] = [
  { h: 0, s: 55, v: 92, a: 1 }, // Red
  { h: 30, s: 55, v: 92, a: 1 }, // Orange
  { h: 120, s: 55, v: 82, a: 1 }, // Green
  { h: 210, s: 55, v: 92, a: 1 }, // Blue
  { h: 270, s: 55, v: 92, a: 1 }, // Purple
  { h: 0, s: 0, v: 100, a: 1 }, // White
  { h: 0, s: 0, v: 0, a: 1 }, // Black
];

// Low brightness (v < 50) is dark, but saturated colors (s > 50) appear dark even at moderate brightness
const isDark = (hsva: HSVA) => hsva.v < 50 || (hsva.s > 50 && hsva.v < 70);

const ColorPicker = ({ hsva, setHsva }: { hsva: HSVA; setHsva: React.Dispatch<React.SetStateAction<HSVA>> }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="flex gap-1">
      {/* We need modal so that the Popover works with a Drawer: https://github.com/shadcn-ui/ui/issues/3516#issuecomment-2312148856 */}
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 rounded-full"
            style={{ backgroundColor: hsvaToHexa(hsva) }}
          >
            <Pipette className="h-4 w-4" style={{ color: isDark(hsva) ? "white" : "black" }} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-fit" align="start">
          <Colorful color={hsva} onChange={(color) => setHsva(color.hsva)} />
        </PopoverContent>
      </Popover>
      {PRESET_COLORS.map((color, i) => {
        const isSelected = hsva.h === color.h && hsva.s === color.s && hsva.v === color.v;
        return (
          <button
            key={i}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center"
            style={{ backgroundColor: hsvaToHexa(color) }}
            onClick={() => setHsva(color)}
          >
            {isSelected && <Check className="h-4 w-4" style={{ color: isDark(color) ? "white" : "black" }} />}
          </button>
        );
      })}
    </div>
  );
};

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <h3 className="text-sm font-semibold mb-1">{label}</h3>
    {children}
  </div>
);

const QRCodeForm = ({ shortUrl }: QRCodeProps) => {
  const { resolvedTheme } = useTheme();
  const [fgColor, setFgColor] = React.useState<HSVA>({ h: 0, s: 0, v: 0, a: 1 });
  const [bgColor, setBgColor] = React.useState<HSVA>({ h: 0, s: 0, v: 100, a: 1 });
  const [logoSrc, setLogoSrc] = React.useState<string>();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setLogoSrc(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setLogoSrc(undefined);
    }
  };

  return (
    <div className="grid items-start gap-4">
      <div className="h-44 rounded-lg border flex items-center justify-center relative overflow-hidden">
        <FlickeringGrid
          className="absolute inset-0 z-0"
          squareSize={2}
          gridGap={3}
          color={resolvedTheme === "light" ? "#000000" : "#FFFFFF"}
          maxOpacity={0.15}
          flickerChance={0.15}
          height={800}
        />
        <QRCodeSVG
          id={QR_CODE_ID}
          className="z-10"
          value={shortUrl}
          fgColor={hsvaToHexa(fgColor)}
          bgColor={hsvaToHexa(bgColor)}
          level={logoSrc ? "M" : "L"}
          imageSettings={logoSrc ? { src: logoSrc, height: 30, width: 30, excavate: true } : undefined}
        />
      </div>
      <FormField label="Logo">
        <Input type="file" accept="image/*" onChange={handleFileChange} />
      </FormField>
      <FormField label="Foreground color">
        <ColorPicker hsva={fgColor} setHsva={setFgColor} />
      </FormField>
      <FormField label="Background color">
        <ColorPicker hsva={bgColor} setHsva={setBgColor} />
      </FormField>
      <DownloadButtons shortUrl={shortUrl} />
    </div>
  );
};

export const QRCodeContent = ({
  shortUrl,
  open,
  onOpenChange,
}: QRCodeProps & { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const isDesktop = useIsDesktop();

  return isDesktop ? (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>{TITLE}</DialogTitle>
          <DialogDescription>{DESCRIPTION}</DialogDescription>
        </DialogHeader>
        <QRCodeForm shortUrl={shortUrl} />
      </DialogContent>
    </Dialog>
  ) : (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div style={{ maxHeight: "90vh", overflowY: "auto" }}>
          <DrawerHeader className="text-left">
            <DrawerTitle>{TITLE}</DrawerTitle>
            <DrawerDescription>{DESCRIPTION}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4">
            <QRCodeForm shortUrl={shortUrl} />
          </div>
          <DrawerFooter className="pt-2" />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export const QRCodeDrawerDialog = ({ shortUrl }: QRCodeProps) => {
  const [open, setOpen] = React.useState(false);
  // Uses state to prevent the modal closing from making the QR code tooltip reappear
  // https://github.com/radix-ui/primitives/issues/617#issuecomment-2067420500
  const [isTooltipAllowed, setIsTooltipAllowed] = React.useState(true);

  return (
    <>
      <Tooltip delayDuration={250}>
        <TooltipTrigger asChild onMouseEnter={() => setIsTooltipAllowed(true)}>
          <Button
            className="z-10"
            variant="outline"
            size="icon"
            onClick={() => {
              setOpen(true);
              setIsTooltipAllowed(false);
            }}
          >
            <QrCode className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        {isTooltipAllowed && (
          <TooltipContent>
            <p>Generate QR code</p>
          </TooltipContent>
        )}
      </Tooltip>
      <QRCodeContent
        shortUrl={shortUrl}
        open={open}
        onOpenChange={(newOpen) => {
          setOpen(newOpen);
          setIsTooltipAllowed(false);
        }}
      />
    </>
  );
};
