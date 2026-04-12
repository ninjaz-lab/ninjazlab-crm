"use client";

import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {ChevronLeft, ChevronRight} from "lucide-react";

interface TablePaginationProps {
    total: number;
    page: number;
    pageSize: number;
    onPageChange: (newPage: number) => void;
    onPageSizeChange?: (newSize: number) => void;
    pageSizeOptions?: number[];
}

export function TablePagination({
                                    total,
                                    page,
                                    pageSize,
                                    onPageChange,
                                    onPageSizeChange,
                                    pageSizeOptions = [10, 20, 50, 100],
                                }: TablePaginationProps) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <div className="px-6 py-4 border-t bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Total {total.toLocaleString()} Records
                </p>

                {onPageSizeChange && (
                    <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-muted-foreground">Rows per page</p>
                        <Select
                            value={String(pageSize)}
                            onValueChange={(val) => onPageSizeChange(Number(val))}
                        >
                            <SelectTrigger className="h-8 w-[70px] text-xs bg-background">
                                <SelectValue placeholder={pageSize}/>
                            </SelectTrigger>
                            <SelectContent side="top">
                                {pageSizeOptions.map((size) => (
                                    <SelectItem key={size} value={String(size)}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-muted-foreground">
                    Page {page} of {totalPages}
                </span>
                <div className="flex gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8 bg-background"
                        disabled={page <= 1}
                        onClick={() => onPageChange(page - 1)}
                    >
                        <ChevronLeft className="size-4"/>
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8 bg-background"
                        disabled={page >= totalPages}
                        onClick={() => onPageChange(page + 1)}
                    >
                        <ChevronRight className="size-4"/>
                    </Button>
                </div>
            </div>
        </div>
    );
}
