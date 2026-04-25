"use client";

import React, {useCallback, useMemo, useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
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
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {
    addAudiencesToList,
    type AudienceListRow,
    type AudienceRow,
    deleteAudience,
    deleteAudiences,
} from "@/lib/actions/audience";
import {fetchImportJobs} from "@/lib/actions/job_import_audience";
import {AudienceForm} from "./audience-form";
import {ImportWizard} from "./import-wizard";
import {DataTable} from "@/components/data-table/data-table";
import {getColumns} from "./columns";
import {HugeIcon} from "@/components/huge-icon";

type ImportJob = Awaited<ReturnType<typeof fetchImportJobs>>[number];

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
        navigate({page: newPage + 1}); // DataTable uses 0-indexed pages internally
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

    const columns = useMemo(() => getColumns(
        audiences.length,
        selected,
        toggleAll,
        toggleSelect,
        setEditAudience,
        setDeleteId
    ), [audiences.length, selected, toggleAll, toggleSelect]);

    // --- Action Slot ---
    const TopActions = (
        <div className="flex flex-wrap items-center gap-2">
            {selected.size > 0 && (
                <>
                    <Button variant="outline" size="sm" onClick={() => setAddToSegmentOpen(true)} className="font-bold">
                        <HugeIcon name="UserAdd01Icon" size={16} className="mr-1"/> Add to segment ({selected.size})
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}
                            className="font-bold">
                        <HugeIcon name="Delete02Icon" size={16} className="mr-1"/> Delete ({selected.size})
                    </Button>
                </>
            )}
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} disabled={isImporting}
                    title={isImporting ? "Import already in progress" : undefined} className="font-bold">
                <HugeIcon name="Upload04Icon" size={16} className="mr-1"/> {isImporting ? "Importing…" : "Import"}
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}
                    className="font-black uppercase tracking-tighter shadow-lg shadow-primary/20">
                <HugeIcon name="PlusSignIcon" size={16} className="mr-1"/> Add contact
            </Button>
        </div>
    );

    return (
        <div className="space-y-4">

            {/* Main Data Table */}
            <DataTable
                columns={columns}
                data={audiences}
                searchPlaceholder="Search audience..."
                actionSlot={TopActions}

                // Server-Side Config
                isServerSide={true}
                totalRows={total}
                currentPage={page}
                pageSize={pageSize}
                searchValue={search ?? ""}
                onSearch={handleSearch}
                onPageChange={changePage}
                onPageSizeChange={changePageSize}
            />

            {/* Create dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
                    <DialogHeader className="p-6 bg-muted/20 border-b">
                        <DialogTitle className="text-xl font-black tracking-tighter">New Contact</DialogTitle>
                    </DialogHeader>
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
                <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
                    <DialogHeader className="p-6 bg-muted/20 border-b">
                        <DialogTitle className="text-xl font-black tracking-tighter">Edit Contact</DialogTitle>
                    </DialogHeader>
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
                        <DialogTitle className="flex items-center gap-3 text-xl font-black tracking-tighter">
                            <div className="p-1.5 bg-primary/10 rounded-md">
                                <HugeIcon name="Database01Icon" size={20} className="text-primary"/>
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
                        <AlertDialogCancel className="font-bold">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={pending}
                                           className="bg-destructive hover:bg-destructive/90 font-bold text-destructive-foreground">Delete</AlertDialogAction>
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
                        <AlertDialogCancel className="font-bold">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} disabled={pending}
                                           className="bg-destructive hover:bg-destructive/90 font-bold text-destructive-foreground">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Add to segment dialog */}
            <Dialog open={addToSegmentOpen} onOpenChange={setAddToSegmentOpen}>
                <DialogContent className="max-w-sm p-0 overflow-hidden gap-0">
                    <DialogHeader className="p-6 bg-muted/20 border-b">
                        <DialogTitle className="text-lg font-black tracking-tighter">Add {selected.size} audiences to
                            segment</DialogTitle>
                    </DialogHeader>
                    <div className="p-6 space-y-4">
                        <Select value={addToSegmentTarget} onValueChange={setAddToSegmentTarget}>
                            <SelectTrigger className="font-bold">
                                <SelectValue placeholder="Select a segment…"/>
                            </SelectTrigger>
                            <SelectContent>
                                {segments.map((s) => (
                                    <SelectItem key={s.id} value={s.id} className="font-medium">{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setAddToSegmentOpen(false)}
                                    className="font-bold">Cancel</Button>
                            <Button onClick={handleAddToSegment} disabled={!addToSegmentTarget || pending}
                                    className="font-black uppercase tracking-tighter">Add to Segment</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}