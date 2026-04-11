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

    const [searchVal, setSearchVal] = useState(search);

    const [createOpen, setCreateOpen] = useState(false);
    const [editAudience, setEditAudience] = useState<AudienceRow | null>(null);
    const [importOpen, setImportOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [addToSegmentOpen, setAddToSegmentOpen] = useState(false);
    const [addToSegmentTarget, setAddToSegmentTarget] = useState("");

    const totalPages = Math.ceil(total / pageSize);
    const isImporting = importJobs.some((j) => j.status === "queued" || j.status === "processing");

    function navigate(params: Record<string, string | number>) {
        const sp = new URLSearchParams();
        if (searchVal) sp.set("search", searchVal);
        if (segmentId) sp.set("segmentId", segmentId);
        sp.set("page", String(page));
        sp.set("pageSize", String(pageSize));
        Object.entries(params).forEach(([k, v]) => {
            if (v) sp.set(k, String(v)); else sp.delete(k);
        });
        router.push(`/audience?${sp.toString()}`);
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        navigate({search: searchVal, page: 1});
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
            prev.size === audiences.length ? new Set() : new Set(audiences.map((c) => c.id))
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
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2 flex-1">
                    {/* 🚩 The dropdown has been completely removed */}
                    <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"/>
                            <Input
                                className="pl-8"
                                placeholder="Search audience…"
                                value={searchVal}
                                onChange={(e) => setSearchVal(e.target.value)}
                            />
                        </div>
                        <Button type="submit" variant="outline">Search</Button>
                    </form>
                </div>
                <div className="flex gap-2">
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
                    <Button variant="outline" onClick={() => setImportOpen(true)} disabled={isImporting}
                            title={isImporting ? "Import already in progress" : undefined}>
                        <Upload className="size-4 mr-1"/> {isImporting ? "Importing…" : "Import"}
                    </Button>
                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="size-4 mr-1"/> Add contact
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-card">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                    <tr>
                        <th className="w-10 p-3">
                            <Checkbox
                                checked={audiences.length > 0 && selected.size === audiences.length}
                                onCheckedChange={toggleAll}
                            />
                        </th>
                        <th className="p-3 text-left font-medium">Name</th>
                        <th className="p-3 text-left font-medium hidden md:table-cell">Email</th>
                        <th className="p-3 text-left font-medium hidden lg:table-cell">Phone</th>
                        <th className="p-3 text-left font-medium hidden xl:table-cell">Source</th>
                        <th className="w-10 p-3"/>
                    </tr>
                    </thead>
                    <tbody>
                    {audiences.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="p-10 text-center text-muted-foreground">
                                No audiences found. Import a file or add one manually.
                            </td>
                        </tr>
                    ) : (
                        audiences.map((c) => (
                            <tr key={c.id} className="border-t hover:bg-muted/30 transition-colors">
                                <td className="p-3">
                                    <Checkbox
                                        checked={selected.has(c.id)}
                                        onCheckedChange={() => toggleSelect(c.id)}
                                    />
                                </td>
                                <td className="p-3 font-medium">{fullName(c)}</td>
                                <td className="p-3 text-muted-foreground hidden md:table-cell">{c.email ?? "—"}</td>
                                <td className="p-3 text-muted-foreground hidden lg:table-cell">{c.phone ?? "—"}</td>
                                <td className="p-3 hidden xl:table-cell">
                                    <Badge variant="outline" className="text-xs capitalize">{c.source}</Badge>
                                </td>
                                <td className="p-3">
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
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{total.toLocaleString()} contact{total !== 1 ? "s" : ""}</span>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline" size="icon" className="size-8"
                        disabled={page <= 1}
                        onClick={() => navigate({page: page - 1})}
                    >
                        <ChevronLeft className="size-4"/>
                    </Button>
                    <span>Page {page} of {totalPages || 1}</span>
                    <Button
                        variant="outline" size="icon" className="size-8"
                        disabled={page >= totalPages}
                        onClick={() => navigate({page: page + 1})}
                    >
                        <ChevronRight className="size-4"/>
                    </Button>
                </div>
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
                        <AlertDialogAction onClick={handleDelete} disabled={pending}>Delete</AlertDialogAction>
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
                        <AlertDialogAction onClick={handleBulkDelete} disabled={pending}>Delete</AlertDialogAction>
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