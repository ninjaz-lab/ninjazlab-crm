"use client";

import React, {useCallback, useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Checkbox} from "@/components/ui/checkbox";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {
    addAudiencesToList,
    type AudienceListRow,
    type AudienceRow,
    deleteAudience,
    deleteAudiences,
    getImportJobs,
} from "@/lib/actions/audience";
import {AudienceForm} from "./audience-form";
import {ImportWizard} from "./import-wizard";
import {
    ChevronLeft,
    ChevronRight,
    Database,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Trash2,
    Upload,
    UserPlus
} from "lucide-react";
import {TablePagination} from "@/components/table-pagination";

type ImportJob = Awaited<ReturnType<typeof getImportJobs>>[number];

interface Props {
    audiences: AudienceRow[];
    total: number;
    segments: AudienceListRow[];
    page: number;
    pageSize: number;
    search: string;
    segmentId: string;
    importJobs: ImportJob[];
}

export function AudienceTable({audiences, total, segments, page, pageSize, search, segmentId, importJobs}: Props) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    const [createOpen, setCreateOpen] = useState(false);
    const [editAudience, setEditAudience] = useState<AudienceRow | null>(null);
    const [importOpen, setImportOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [addToSegmentOpen, setAddToSegmentOpen] = useState(false);
    const [addToSegmentTarget, setAddToSegmentTarget] = useState("");

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const isImporting = importJobs.some((j) => j.status === "queued" || j.status === "processing");

    function navigate(params: Record<string, string | number>) {
        const sp = new URLSearchParams();
        if (search) sp.set("search", search);
        if (segmentId) sp.set("segmentId", segmentId);
        sp.set("page", String(page));
        sp.set("pageSize", String(pageSize));
        Object.entries(params).forEach(([k, v]) => {
            if (v) sp.set(k, String(v)); else sp.delete(k);
        });
        router.push(`/audience?${sp.toString()}`);
    }

    function handleSearch(term: string) {
        navigate({search: term, page: 1});
    }

    function changePage(newPage: number) {
        navigate({page: newPage});
    }

    function changePageSize(newSize: number) {
        navigate({pageSize: newSize, page: 1});
    }

    const toggleSelect = useCallback((id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }, []);

    const toggleAll = useCallback(() => {
        setSelected((prev) =>
            prev.size === audiences.length && audiences.length > 0 ? new Set() : new Set(audiences.map((c) => c.id))
        );
    }, [audiences]);

    function handleDelete() {
        if (!deleteId) return;
        startTransition(async () => {
            await deleteAudience(deleteId);
            setDeleteId(null);
            router.refresh();
        });
    }

    function handleBulkDelete() {
        startTransition(async () => {
            await deleteAudiences(Array.from(selected));
            setSelected(new Set());
            setBulkDeleteOpen(false);
            router.refresh();
        });
    }

    function handleAddToSegment() {
        if (!addToSegmentTarget) return;
        startTransition(async () => {
            await addAudiencesToList(addToSegmentTarget, Array.from(selected));
            setAddToSegmentOpen(false);
            setAddToSegmentTarget("");
            router.refresh();
        });
    }

    function fullName(c: AudienceRow) {
        return [c.firstName, c.lastName].filter(Boolean).join(" ") || "—";
    }

    return (
        <div className="space-y-4">
            {/* Header: Search + Actions + Top Pagination */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="relative max-w-sm flex-1 w-full">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"/>
                    <Input
                        placeholder="Search audience..."
                        className="pl-8 bg-background"
                        defaultValue={search ?? ""}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {selected.size > 0 && (
                        <>
                            <Button variant="outline" size="sm" onClick={() => setAddToSegmentOpen(true)}>
                                <UserPlus className="size-4 mr-1"/> Add to segment ({selected.size})
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
                                <Trash2 className="size-4 mr-1"/> Delete ({selected.size})
                            </Button>
                        </>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} disabled={isImporting}
                            title={isImporting ? "Import already in progress" : undefined}>
                        <Upload className="size-4 mr-1"/> {isImporting ? "Importing…" : "Import"}
                    </Button>
                    <Button size="sm" onClick={() => setCreateOpen(true)}>
                        <Plus className="size-4 mr-1"/> Add contact
                    </Button>

                    <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground ml-2">
                        <span>{page} / {totalPages}</span>
                        <div className="flex gap-1">
                            <Button variant="outline" size="icon" className="size-8" disabled={page <= 1}
                                    onClick={() => changePage(page - 1)}>
                                <ChevronLeft className="size-4"/>
                            </Button>
                            <Button variant="outline" size="icon" className="size-8" disabled={page >= totalPages}
                                    onClick={() => changePage(page + 1)}>
                                <ChevronRight className="size-4"/>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="w-[50px] text-center">
                                <Checkbox
                                    checked={audiences.length > 0 && selected.size === audiences.length}
                                    onCheckedChange={toggleAll}
                                />
                            </TableHead>
                            <TableHead className="font-bold">Name</TableHead>
                            <TableHead className="font-bold hidden md:table-cell">Email</TableHead>
                            <TableHead className="font-bold hidden lg:table-cell">Phone</TableHead>
                            <TableHead className="font-bold hidden xl:table-cell">Source</TableHead>
                            <TableHead className="w-12"/>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {audiences.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No audiences found. Import a file or add one manually.
                                </TableCell>
                            </TableRow>
                        ) : (
                            audiences.map((c) => (
                                <TableRow key={c.id} className="hover:bg-muted/40 transition-colors group">
                                    <TableCell className="text-center">
                                        <Checkbox
                                            checked={selected.has(c.id)}
                                            onCheckedChange={() => toggleSelect(c.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{fullName(c)}</TableCell>
                                    <TableCell
                                        className="text-muted-foreground hidden md:table-cell">{c.email ?? "—"}</TableCell>
                                    <TableCell
                                        className="text-muted-foreground hidden lg:table-cell">{c.phone ?? "—"}</TableCell>
                                    <TableCell className="hidden xl:table-cell">
                                        <Badge variant="outline" className="text-xs capitalize">{c.source}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8">
                                                    <MoreHorizontal className="size-4"/>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setEditAudience(c)}>
                                                    <Pencil className="size-4 mr-2"/> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator/>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => setDeleteId(c.id)}
                                                >
                                                    <Trash2 className="size-4 mr-2"/> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                <TablePagination
                    total={total}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={changePage}
                    onPageSizeChange={changePageSize}
                />

            </div>

            {/* Create dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>New Contact</DialogTitle></DialogHeader>
                    <AudienceForm onDone={() => {
                        setCreateOpen(false);
                        router.refresh();
                    }}/>
                </DialogContent>
            </Dialog>

            {/* Edit dialog */}
            <Dialog open={!!editAudience} onOpenChange={(o) => {
                if (!o) setEditAudience(null);
            }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Edit Contact</DialogTitle></DialogHeader>
                    {editAudience && (
                        <AudienceForm
                            contact={editAudience}
                            onDone={() => {
                                setEditAudience(null);
                                router.refresh();
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* POP-UP IMPORT MODAL */}
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogContent
                    className="sm:max-w-5xl w-[95vw] h-[85vh] p-0 flex flex-col overflow-hidden gap-0 bg-muted/5">
                    <DialogHeader className="px-8 py-5 border-b bg-background flex-shrink-0">
                        <DialogTitle className="flex items-center gap-3 text-xl">
                            <div className="p-1.5 bg-primary/10 rounded-md">
                                <Database className="size-5 text-primary"/>
                            </div>
                            Import Audiences
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden relative">
                        <ImportWizard
                            segments={segments}
                            onDone={() => {
                                setImportOpen(false);
                                router.refresh();
                            }}
                            onCancel={() => setImportOpen(false)}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete confirm */}
            <AlertDialog open={!!deleteId} onOpenChange={(o) => {
                if (!o) setDeleteId(null);
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete audience?</AlertDialogTitle>
                        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={pending}
                                           className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk delete confirm */}
            <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selected.size} audiences?</AlertDialogTitle>
                        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} disabled={pending}
                                           className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Add to segment dialog */}
            <Dialog open={addToSegmentOpen} onOpenChange={setAddToSegmentOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Add {selected.size} audiences to segment</DialogTitle></DialogHeader>
                    <Select value={addToSegmentTarget} onValueChange={setAddToSegmentTarget}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a segment…"/>
                        </SelectTrigger>
                        <SelectContent>
                            {segments.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setAddToSegmentOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddToSegment} disabled={!addToSegmentTarget || pending}>Add</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
