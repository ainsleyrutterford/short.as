import { ChevronLeftIcon, ChevronRightIcon, ChevronFirstIcon, ChevronLastIcon } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";

interface UrlPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const UrlPagination = ({ currentPage, totalPages, onPageChange }: UrlPaginationProps) => {
  return (
    <Pagination className="mb-14">
      <PaginationContent>
        <PaginationItem>
          <PaginationLink
            onClick={() => onPageChange(1)}
            aria-label="Go to first page"
            size="icon"
            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
          >
            <ChevronFirstIcon className="h-4 w-4" />
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            aria-label="Go to previous page"
            size="icon"
            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <p className="text-muted-foreground text-sm px-2" aria-live="polite">
            Page <span className="text-foreground">{currentPage}</span> of{" "}
            <span className="text-foreground">{totalPages}</span>
          </p>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            aria-label="Go to next page"
            size="icon"
            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            onClick={() => onPageChange(totalPages)}
            aria-label="Go to last page"
            size="icon"
            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
          >
            <ChevronLastIcon className="h-4 w-4" />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
