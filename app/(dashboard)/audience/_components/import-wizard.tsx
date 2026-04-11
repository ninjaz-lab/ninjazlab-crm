"use client";

import {useState, useTransition} from "react";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {type AudienceListRow, parseImportFile, queueAudienceImport} from "@/lib/actions/audience";
import {IMPORT_FIELD_LABELS, type ImportField, suggestMapping} from "@/lib/audience-utils";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    CopyPlus,
    Database,
    FileSpreadsheet,
    Loader2,
    RefreshCcw,
    TableProperties,
    UploadCloud
} from "lucide-react";
import {cn} from "@/lib/utils";

// Expanded to 5 steps
const STEPS = ["Upload", "Map Columns", "Settings", "Review", "Import"];

interface Props {
    segments: AudienceListRow[];
    onDone: () => void;
    onCancel: () => void;
}

export function ImportWizard({segments, onDone, onCancel}: Props) {
    const [step, setStep] = useState(0);
    const [pending, startTransition] = useTransition();

    // Step 1
    const [file, setFile] = useState<File | null>(null);
    // Step 2
    const [headers, setHeaders] = useState<string[]>([]);
    const [preview, setPreview] = useState<string[][]>([]);
    const [totalRows, setTotalRows] = useState(0);
    const [mapping, setMapping] = useState<Record<string, ImportField>>({});
    // Step 3
    const [mergeStrategy, setMergeStrategy] = useState<"fill" | "overwrite">("fill");
    const [addToSegmentId, setAddToSegmentId] = useState<string>("none");
    // Step 5 (Result)
    const [result, setResult] = useState<{ jobId: string; totalRows: number } | null>(null);

    function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
    }

    function handleParseFile() {
        if (!file) return;
        startTransition(async () => {
            const fd = new FormData();
            fd.append("file", file);
            const res = await parseImportFile(fd);
            setHeaders(res.headers);
            setPreview(res.preview);
            setTotalRows(res.totalRows);
            setMapping(suggestMapping(res.headers));
            setStep(1);
        });
    }

    function handleRunImport() {
        if (!file) return;
        startTransition(async () => {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("mapping", JSON.stringify(mapping));
            fd.append("mergeStrategy", mergeStrategy);
            if (addToSegmentId && addToSegmentId !== "none") {
                fd.append("addToListId", addToSegmentId);
            }
            const res = await queueAudienceImport(fd);
            setResult(res);
            setStep(4); // Move to final success step
        });
    }

    // Filter out skipped headers for the review table
    const mappedHeaders = headers.filter(h => mapping[h] && mapping[h] !== "skip");

    const stepContent = [
        // ─────────────────────────────────────────────────────────
        // STEP 1: UPLOAD (Index 0)
        // ─────────────────────────────────────────────────────────
        <div key="upload" className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
                <label
                    className={cn(
                        "group relative flex w-full max-w-xl cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-16 transition-all duration-200 hover:bg-muted/30 bg-background shadow-sm",
                        file ? "border-primary/50 bg-primary/5" : "border-muted-foreground/25 hover:border-primary/40"
                    )}
                >
                    <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                    <div className="flex flex-col items-center justify-center space-y-5 text-center">
                        <div className={cn(
                            "rounded-full p-5 transition-all duration-200",
                            file ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground group-hover:scale-105 group-hover:text-primary"
                        )}>
                            {file ? <FileSpreadsheet className="size-10"/> : <UploadCloud className="size-10"/>}
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                                {file ? "File selected" : "Upload your contacts"}
                            </h3>
                            <p className="text-base text-muted-foreground max-w-[300px]">
                                {file ? file.name : "Drag and drop your Excel (.xlsx) or CSV file here, or click to browse."}
                            </p>
                        </div>

                        {!file && (
                            <div className="pt-6">
                                <span
                                    className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                                    Select File
                                </span>
                            </div>
                        )}
                    </div>
                </label>
            </div>

            <div
                className="flex items-center justify-end border-t bg-background px-8 py-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] z-10">
                <Button size="lg" onClick={handleParseFile} disabled={!file || pending}
                        className="px-8 rounded-full h-12 text-base">
                    {pending ? <Loader2 className="mr-2 size-5 animate-spin"/> : null}
                    Continue <ArrowRight className="ml-2 size-5"/>
                </Button>
            </div>
        </div>,

        // ─────────────────────────────────────────────────────────
        // STEP 2: MAP COLUMNS (Index 1)
        // ─────────────────────────────────────────────────────────
        <div key="map" className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex-1 overflow-hidden px-8 py-6 flex flex-col items-center">
                <div
                    className="w-full max-w-6xl h-full rounded-2xl border border-border shadow-sm flex flex-col bg-card overflow-hidden">
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-sm text-left">
                            <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-md border-b">
                            <tr>
                                <th className="px-8 py-5 font-semibold text-muted-foreground w-1/3">Your File Column
                                </th>
                                <th className="px-8 py-5 font-semibold text-muted-foreground w-1/3">Sample Data</th>
                                <th className="px-8 py-5 font-semibold text-muted-foreground w-1/3">Destination Field
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                            {headers.map((h, i) => {
                                const isMapped = mapping[h] && mapping[h] !== "skip";
                                return (
                                    <tr
                                        key={h}
                                        className={cn(
                                            "group transition-colors hover:bg-muted/40",
                                            !isMapped && "opacity-60 bg-muted/10"
                                        )}
                                    >
                                        <td className="px-8 py-5 font-medium text-base text-foreground">{h}</td>
                                        <td className="px-8 py-5">
                                            <span
                                                className="inline-block max-w-[250px] truncate text-sm font-mono text-muted-foreground rounded-md bg-muted px-3 py-1.5 border border-border/50">
                                                {/* Only show the first record as a sample */}
                                                {preview.map((r) => r[i]).filter(Boolean)[0] || "Empty"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <Select
                                                value={mapping[h] ?? "skip"}
                                                onValueChange={(v) =>
                                                    setMapping((prev) => ({...prev, [h]: v as ImportField}))
                                                }
                                            >
                                                <SelectTrigger className={cn(
                                                    "w-full max-w-[280px] h-11 transition-all",
                                                    isMapped ? "border-primary/40 bg-primary/5 focus:ring-primary" : "bg-background"
                                                )}>
                                                    <SelectValue placeholder="Select field..."/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="skip"
                                                                className="text-muted-foreground italic font-medium">
                                                        — Do not import —
                                                    </SelectItem>
                                                    {(Object.keys(IMPORT_FIELD_LABELS) as ImportField[]).map((f) => (
                                                        <SelectItem key={f} value={f}>
                                                            {IMPORT_FIELD_LABELS[f]}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div
                className="flex items-center justify-between border-t bg-background px-8 py-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] z-10">
                <Button variant="ghost" onClick={() => setStep(0)} className="rounded-full h-12 px-6 text-base">
                    <ArrowLeft className="mr-2 size-5"/> Back
                </Button>
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2 text-base text-muted-foreground">
                        <Database className="size-5"/>
                        <span className="font-semibold text-foreground">{totalRows.toLocaleString()}</span> rows
                        detected
                    </div>
                    <Button size="lg" onClick={() => setStep(2)} className="px-8 rounded-full h-12 text-base">
                        Continue to Settings <ArrowRight className="ml-2 size-5"/>
                    </Button>
                </div>
            </div>
        </div>,

        // ─────────────────────────────────────────────────────────
        // STEP 3: SETTINGS (Index 2)
        // ─────────────────────────────────────────────────────────
        <div key="settings" className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex-1 overflow-auto px-8 py-12 flex flex-col items-center">
                <div className="w-full max-w-3xl space-y-12 bg-background p-10 rounded-3xl border shadow-sm">

                    <div className="text-center space-y-3">
                        <h2 className="text-3xl font-bold tracking-tight">Import Settings</h2>
                        <p className="text-lg text-muted-foreground">Configure how your <strong
                            className="text-foreground">{totalRows.toLocaleString()}</strong> contacts should be saved.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                            Conflict Resolution
                        </Label>
                        <RadioGroup
                            value={mergeStrategy}
                            onValueChange={(v) => setMergeStrategy(v as "fill" | "overwrite")}
                            className="grid gap-5 sm:grid-cols-2"
                        >
                            <label
                                htmlFor="ms-fill"
                                className={cn(
                                    "relative flex cursor-pointer flex-col gap-4 rounded-2xl border-2 p-6 transition-all duration-200 hover:shadow-md",
                                    mergeStrategy === "fill" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <div
                                        className={cn("rounded-full p-3", mergeStrategy === "fill" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                                        <CopyPlus className="size-6"/>
                                    </div>
                                    <RadioGroupItem value="fill" id="ms-fill" className="sr-only"/>
                                    {mergeStrategy === "fill" &&
                                        <Check className="size-6 text-primary" strokeWidth={3}/>}
                                </div>
                                <div className="space-y-2">
                                    <span className="block text-lg font-semibold text-foreground">Fill Blanks</span>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Safest option. Only populates data if the field is currently empty. Existing
                                        data will never be overwritten.
                                    </p>
                                </div>
                            </label>

                            <label
                                htmlFor="ms-overwrite"
                                className={cn(
                                    "relative flex cursor-pointer flex-col gap-4 rounded-2xl border-2 p-6 transition-all duration-200 hover:shadow-md",
                                    mergeStrategy === "overwrite" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <div
                                        className={cn("rounded-full p-3", mergeStrategy === "overwrite" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                                        <RefreshCcw className="size-6"/>
                                    </div>
                                    <RadioGroupItem value="overwrite" id="ms-overwrite" className="sr-only"/>
                                    {mergeStrategy === "overwrite" &&
                                        <Check className="size-6 text-primary" strokeWidth={3}/>}
                                </div>
                                <div className="space-y-2">
                                    <span className="block text-lg font-semibold text-foreground">Overwrite All</span>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Destructive action. Replaces existing database records with the new data from
                                        this import file.
                                    </p>
                                </div>
                            </label>
                        </RadioGroup>
                    </div>

                    <div className="space-y-5 pt-8 border-t">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                                Organization (Optional)
                            </Label>
                            <p className="text-base text-muted-foreground">Automatically group these imported contacts
                                into a segment.</p>
                        </div>
                        <Select value={addToSegmentId} onValueChange={setAddToSegmentId}>
                            <SelectTrigger className="h-14 text-base rounded-xl bg-muted/20">
                                <SelectValue placeholder="Select a segment…"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none" className="font-medium">No segment</SelectItem>
                                {segments.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                </div>
            </div>

            <div
                className="flex items-center justify-between border-t bg-background px-8 py-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] z-10">
                <Button variant="ghost" onClick={() => setStep(1)} className="rounded-full h-12 px-6 text-base">
                    <ArrowLeft className="mr-2 size-5"/> Back
                </Button>
                <Button size="lg" onClick={() => setStep(3)} className="px-8 rounded-full h-12 text-base">
                    Continue to Review <ArrowRight className="ml-2 size-5"/>
                </Button>
            </div>
        </div>,

        // ─────────────────────────────────────────────────────────
        // STEP 4: REVIEW DATA GRID (Index 3)
        // ─────────────────────────────────────────────────────────
        <div key="review" className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex-1 overflow-hidden px-8 py-6 flex flex-col items-center">
                <div
                    className="w-full max-w-6xl h-full rounded-2xl border border-border shadow-sm flex flex-col bg-card overflow-hidden">

                    <div className="bg-muted/30 px-6 py-4 border-b flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                                <TableProperties className="size-4"/>
                            </div>
                            <h3 className="font-semibold text-foreground">Data Preview</h3>
                        </div>
                        <div
                            className="text-sm text-muted-foreground font-medium bg-background px-3 py-1 rounded-full border shadow-sm">
                            Showing {preview.length} sample rows
                        </div>
                    </div>

                    <div className="overflow-auto flex-1">
                        <table className="w-full text-sm text-left">
                            <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-md border-b">
                            <tr>
                                <th className="px-6 py-4 text-muted-foreground w-16 text-center border-r font-medium">#</th>
                                {mappedHeaders.map(h => (
                                    <th key={h} className="px-6 py-4 font-semibold text-foreground">
                                        {IMPORT_FIELD_LABELS[mapping[h] as ImportField]}
                                        <span
                                            className="block text-xs font-normal text-muted-foreground mt-0.5">from: {h}</span>
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                            {preview.map((row, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-6 py-3 text-center text-muted-foreground font-mono text-xs border-r">
                                        {rowIndex + 1}
                                    </td>
                                    {mappedHeaders.map(h => {
                                        const colIndex = headers.indexOf(h);
                                        const cellData = row[colIndex];
                                        return (
                                            <td key={h} className="px-6 py-3 font-mono text-sm max-w-[250px] truncate">
                                                {cellData ? (
                                                    cellData
                                                ) : (
                                                    <span
                                                        className="text-muted-foreground/50 italic text-xs">null</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div
                className="flex items-center justify-between border-t bg-background px-8 py-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] z-10">
                <Button variant="ghost" onClick={() => setStep(2)} className="rounded-full h-12 px-6 text-base">
                    <ArrowLeft className="mr-2 size-5"/> Back
                </Button>
                <Button size="lg" onClick={handleRunImport} disabled={pending}
                        className="px-10 rounded-full h-12 text-base font-semibold">
                    {pending ? <Loader2 className="mr-2 size-5 animate-spin"/> : null}
                    Submit {totalRows.toLocaleString()} Contacts
                </Button>
            </div>
        </div>,

        // ─────────────────────────────────────────────────────────
        // STEP 5: SUCCESS (Index 4)
        // ─────────────────────────────────────────────────────────
        <div key="result" className="flex flex-col h-full animate-in zoom-in-95 duration-500">
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8 text-center">
                <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20"/>
                    <div
                        className="relative flex size-32 items-center justify-center rounded-full bg-green-500/10 text-green-500 shadow-sm border border-green-500/20">
                        <Check className="size-14" strokeWidth={3}/>
                    </div>
                </div>

                <div className="space-y-4 max-w-lg">
                    <h3 className="text-4xl font-bold tracking-tight text-foreground">Import Queued</h3>
                    <p className="text-lg text-muted-foreground">
                        <strong
                            className="text-foreground font-semibold">{result?.totalRows.toLocaleString()}</strong> contacts
                        are being processed in the background. You can safely close this window.
                    </p>
                </div>
            </div>

            <div className="flex justify-center border-t bg-background px-8 py-6">
                <Button size="lg" className="w-full max-w-sm rounded-full h-14 text-lg font-semibold" onClick={onDone}>
                    Done
                </Button>
            </div>
        </div>,
    ];

    return (
        <div className="flex flex-col w-full h-full bg-background">
            {/* Sleek Header Stepper */}
            <div className="px-8 py-6 bg-background border-b z-10 flex-shrink-0">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    {STEPS.map((s, i) => {
                        const isActive = i === step;
                        const isCompleted = i < step;

                        return (
                            <div key={s} className="flex flex-col items-center gap-3 relative z-10 w-28">
                                <div
                                    className={cn(
                                        "flex size-10 items-center justify-center rounded-full text-base font-bold transition-all duration-300",
                                        isCompleted
                                            ? "bg-primary text-primary-foreground shadow-md ring-4 ring-primary/10"
                                            : isActive
                                                ? "bg-background border-2 border-primary text-primary ring-4 ring-primary/10"
                                                : "bg-muted text-muted-foreground border-2 border-transparent"
                                    )}
                                >
                                    {isCompleted ? <Check className="size-5" strokeWidth={3}/> : i + 1}
                                </div>
                                <span className={cn(
                                    "text-sm font-semibold transition-colors hidden sm:block text-center",
                                    isActive ? "text-foreground" : isCompleted ? "text-foreground" : "text-muted-foreground"
                                )}>
                                    {s}
                                </span>

                                {/* Connecting Line */}
                                {i < STEPS.length - 1 && (
                                    <div
                                        className={cn(
                                            "absolute top-5 left-[70%] w-full h-[2px] transition-all duration-500",
                                            isCompleted ? "bg-primary" : "bg-muted-foreground/20"
                                        )}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative bg-muted/5">
                {stepContent[step]}
            </div>
        </div>
    );
}