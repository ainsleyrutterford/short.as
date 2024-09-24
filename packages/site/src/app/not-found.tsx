import { Separator } from "@/components/ui/separator";

export default function NotFound() {
  return (
    <div className="flex h-10 items-center justify-center space-x-4 mt-20">
      <p className="text-2xl font-semibold">404</p>
      <Separator orientation="vertical" />
      <div>This page could not be found</div>
    </div>
  );
}
