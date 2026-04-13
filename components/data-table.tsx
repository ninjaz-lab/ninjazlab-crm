"use client";

import * as React from "react";
import {
    ColumnDef,
    FilterFn,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from "@tanstack/react-table";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle} from "@/components/ui/empty";
import {HugeIcon} from "@/components/huge-icon";
import {cn} from "@/lib/utils";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchPlaceholder?: string;
    globalFilterFn?: FilterFn<TData>;
    onRowClick?: (data: TData) => void;

    // UI Configuration Props
    hideSearch?: boolean;
    actionSlot?: React.ReactNode;

    // Server-Side Mode Props
    isServerSide?: boolean;
    totalRows?: number;
    currentPage?: number;
    pageSize?: number;
    searchValue?: string;
    onSearch?: (term: string) => void;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
}

export function DataTable<TData, TValue>({
                                             columns,
                                             data,
                                             searchPlaceholder = "Search...",
                                             globalFilterFn,
                                             onRowClick,

                                             hideSearch = false,
                                             actionSlot,

                                             isServerSide = false,
                                             totalRows = 0,
                                             currentPage = 1,
                                             pageSize = 10,
                                             searchValue = "",
                                             onSearch,
                                             onPageChange,
                                             onPageSizeChange,
                                         }: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [clientGlobalFilter, setClientGlobalFilter] = React.useState("");
    const [clientPagination, setClientPagination] = React.useState({pageIndex: 0, pageSize: 10});

    const activeGlobalFilter = isServerSide ? searchValue : clientGlobalFilter;
    const activePagination = isServerSide
        ? {pageIndex: currentPage - 1, pageSize: pageSize}
        : clientPagination;

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: isServerSide ? undefined : setClientGlobalFilter,
        onPaginationChange: isServerSide ? undefined : setClientPagination,
        globalFilterFn: globalFilterFn,

        manualPagination: isServerSide,
        manualFiltering: isServerSide,
        pageCount: isServerSide ? Math.ceil(totalRows / pageSize) : undefined,

        state: {
            sorting,
            globalFilter: activeGlobalFilter,
            pagination: activePagination,
        },
    });

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (isServerSide && onSearch) onSearch(val);
        else setClientGlobalFilter(val);
    };

    const totalItems = isServerSide ? totalRows : table.getFilteredRowModel().rows.length;

    return (
        <div className="space-y-4">

            {(!hideSearch || actionSlot) ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
                    {!hideSearch ? (
                        <div
                            className="relative w-full sm:max-w-md animate-in fade-in slide-in-from-left-2 duration-300">
                            <HugeIcon
                                name="Search01Icon"
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                            <Input
                                placeholder={searchPlaceholder}
                                value={activeGlobalFilter}
                                onChange={handleSearchChange}
                                className="pl-9 h-10"
                            />
                        </div>
                    ) : <div className="flex-1"/>}

                    {actionSlot && (
                        <div
                            className="flex items-center gap-3 w-full sm:w-auto animate-in fade-in slide-in-from-right-2 duration-300">
                            {actionSlot}
                        </div>
                    )}
                </div>
            ) : null}

            <div className="rounded-xl border bg-card shadow-md overflow-hidden transition-all flex flex-col">
                <Table>
                    <TableHeader className="bg-muted/40">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}
                                               className={header.column.id === "index" ? "w-[60px]" : ""}>
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className={cn("group transition-colors hover:bg-muted/30", onRowClick && "cursor-pointer")}
                                    onClick={() => onRowClick?.(row.original)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}
                                                   className={cell.column.id === "index" ? "w-[60px]" : ""}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="py-20">
                                    <Empty>
                                        <EmptyHeader>
                                            <EmptyMedia variant="icon" className="mb-2">
                                                <HugeIcon name="Search01Icon" size={32}/>
                                            </EmptyMedia>
                                            <EmptyTitle className="text-lg font-black tracking-tight">No results
                                                found</EmptyTitle>
                                            <EmptyDescription className="text-sm font-medium text-muted-foreground">
                                                {activeGlobalFilter ? `No matches for "${activeGlobalFilter}".` : "There is no data to display here."}
                                            </EmptyDescription>
                                        </EmptyHeader>
                                        {activeGlobalFilter && (
                                            <EmptyContent>
                                                <Button variant="outline" size="sm"
                                                        onClick={() => isServerSide && onSearch ? onSearch("") : setClientGlobalFilter("")}
                                                        className="font-bold mt-2">
                                                    Clear Search
                                                </Button>
                                            </EmptyContent>
                                        )}
                                    </Empty>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {totalItems > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/10">
                        <div className="flex-1 text-xs font-medium text-muted-foreground hidden sm:block">
                            Showing
                            page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} ({totalItems} total)
                        </div>
                        <div className="flex items-center space-x-6 lg:space-x-8">
                            <div className="flex items-center space-x-2">
                                <p className="text-xs font-bold text-muted-foreground">Rows per page</p>
                                <Select
                                    value={`${table.getState().pagination.pageSize}`}
                                    onValueChange={(value) => {
                                        const size = Number(value);
                                        if (isServerSide && onPageSizeChange) onPageSizeChange(size);
                                        else table.setPageSize(size);
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-[70px] text-xs font-bold">
                                        <SelectValue placeholder={table.getState().pagination.pageSize}/>
                                    </SelectTrigger>
                                    <SelectContent side="top">
                                        {[10, 20, 30, 40, 50].map((size) => (
                                            <SelectItem key={size} value={`${size}`}
                                                        className="text-xs font-bold">{size}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div
                                className="flex w-[100px] items-center justify-center text-xs font-bold text-muted-foreground">
                                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() => isServerSide && onPageChange ? onPageChange(currentPage - 1) : table.previousPage()}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    <span className="sr-only">Previous page</span>
                                    <HugeIcon name="ArrowLeft01Icon" size={14}/>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() => isServerSide && onPageChange ? onPageChange(currentPage + 1) : table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                >
                                    <span className="sr-only">Next page</span>
                                    <HugeIcon name="ArrowRight01Icon" size={14}/>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}