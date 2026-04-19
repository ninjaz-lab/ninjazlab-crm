"use client";

import {useState, useTransition} from "react";
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
import {type AudienceListRow, deleteAudienceList} from "@/lib/actions/audience";
import {Pencil, Plus, Trash2, Users} from "lucide-react";
import {cn} from "@/lib/utils/utils";
import {SegmentBuilder} from "./segment-builder";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";

interface Props {
    segments: AudienceListRow[];
    activeSegmentId?: string;
}

export function SegmentsPanel({segments, activeSegmentId}: Props) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSegment, setEditingSegment] = useState<AudienceListRow | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    function handleDelete() {
        if (!deleteId)
            return;
        startTransition(async () => {
            await deleteAudienceList(deleteId);
            setDeleteId(null);
            if (activeSegmentId === deleteId) router.push("/audience");
            else router.refresh();
        });
    }

    function handleEdit(segment: AudienceListRow) {
        setEditingSegment(segment);
        setDialogOpen(true);
    }

    function handleCreateNew() {
        setEditingSegment(null);
        setDialogOpen(true);
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Segments</span>
                <TooltipProvider delayDuration={100}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-6" onClick={handleCreateNew}>
                                <Plus className="size-3.5"/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-foreground text-background font-medium text-xs">
                            <p>Create Segment</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <div className="space-y-0.5">
                <button
                    onClick={() => router.push("/audience")}
                    className={cn(
                        "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
                        !activeSegmentId && "bg-muted font-medium"
                    )}
                >
                    <Users className="size-4 text-muted-foreground"/>
                    <span>All audience</span>
                </button>

                {segments.map((s) => (
                    <div
                        key={s.id}
                        className={cn(
                            "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
                            activeSegmentId === s.id && "bg-muted font-medium"
                        )}
                    >
                        <button
                            className="flex flex-1 items-center gap-2 min-w-0 text-left"
                            onClick={() => router.push(`/audience?segmentId=${s.id}`)}
                        >
                            <span
                                className="size-2.5 rounded-full flex-shrink-0"
                                style={{backgroundColor: s.color ?? "#6366f1"}}
                            />
                            <span className="truncate">{s.name}</span>

                            <span className="ml-auto text-xs text-muted-foreground">
                                {s.count}
                            </span>
                        </button>

                        <div
                            className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <Button
                                variant="ghost" size="icon"
                                className="size-5"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(s);
                                }}
                            >
                                <Pencil className="size-3 text-muted-foreground"/>
                            </Button>
                            <Button
                                variant="ghost" size="icon"
                                className="size-5"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteId(s.id);
                                }}
                            >
                                <Trash2 className="size-3 text-muted-foreground"/>
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* CREATE / EDIT DYNAMIC SEGMENT DIALOG */}
            <Dialog open={dialogOpen} onOpenChange={(open) => {
                if (!open) {
                    setDialogOpen(false);
                    setTimeout(() => setEditingSegment(null), 300);
                } else {
                    setDialogOpen(true);
                }
            }}>
                <DialogContent className="sm:max-w-5xl w-[95vw] h-[85vh] p-0 flex flex-col overflow-hidden gap-0">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                        <DialogTitle className="text-2xl font-bold tracking-tight">
                            {editingSegment ? "Edit Dynamic Segment" : "Create Dynamic Segment"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden">
                        <SegmentBuilder
                            initialSegment={editingSegment}
                            onDone={() => {
                                setDialogOpen(false);
                                setTimeout(() => setEditingSegment(null), 300);
                                router.refresh();
                            }}
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
                        <AlertDialogTitle>Delete segment?</AlertDialogTitle>
                        <AlertDialogDescription>Contacts in this segment won&apos;t be deleted, only the segment
                            itself.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete} disabled={pending}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}