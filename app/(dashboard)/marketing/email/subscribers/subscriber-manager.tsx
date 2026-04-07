"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { createEmailList, addSubscribers, getListSubscribers } from "@/lib/actions/email-marketing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Upload,
  Users,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  X,
} from "lucide-react";

type List = { id: string; name: string; subscriberCount: number; description: string | null };
type Subscriber = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  status: string;
  createdAt: Date;
};
type ParsedRow = Record<string, string>;

// ─── Step machine for the import dialog ───────────────────────────────────
// Step 1: Upload file  →  Step 2: Map columns  →  Step 3: Preview & confirm
type ImportStep = "upload" | "map" | "preview";

const NONE = "__none__";

export function SubscriberManager({
  lists,
  defaultListId,
}: {
  lists: List[];
  defaultListId?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedListId, setSelectedListId] = useState(defaultListId ?? lists[0]?.id ?? "");
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  // ── New list dialog ──────────────────────────────────────────────────────
  const [newListOpen, setNewListOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");

  // ── Import dialog state ──────────────────────────────────────────────────
  const [importOpen, setImportOpen] = useState(false);
  const [importStep, setImportStep] = useState<ImportStep>("upload");

  // Step 1: file parse results
  const [fileName, setFileName] = useState("");
  const [columns, setColumns] = useState<string[]>([]);       // headers from sheet
  const [rows, setRows] = useState<ParsedRow[]>([]);           // all data rows
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: column mapping
  const [mapEmail, setMapEmail] = useState(NONE);
  const [mapFirst, setMapFirst] = useState(NONE);
  const [mapLast, setMapLast] = useState(NONE);

  // Step 3: validation
  const [validRows, setValidRows] = useState<{ email: string; firstName?: string; lastName?: string }[]>([]);
  const [invalidCount, setInvalidCount] = useState(0);

  // ── Load subscribers when list changes ───────────────────────────────────
  useEffect(() => {
    if (!selectedListId) return;
    startTransition(async () => {
      const subs = await getListSubscribers(selectedListId);
      setSubscribers(subs as Subscriber[]);
    });
  }, [selectedListId]);

  // ── File parsing ─────────────────────────────────────────────────────────
  function parseFile(file: File) {
    if (!file) return;

    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    const isCsv = file.name.endsWith(".csv");
    if (!isExcel && !isCsv) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: ParsedRow[] = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
        raw: false,
      });

      if (json.length === 0) return;

      const cols = Object.keys(json[0]);
      setColumns(cols);
      setRows(json);

      // Auto-detect common column names
      const find = (patterns: string[]) =>
        cols.find((c) =>
          patterns.some((p) => c.toLowerCase().includes(p))
        ) ?? NONE;

      setMapEmail(find(["email", "e-mail", "mail"]));
      setMapFirst(find(["first", "fname", "given"]));
      setMapLast(find(["last", "lname", "surname", "family"]));

      setImportStep("map");
    };
    reader.readAsBinaryString(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  }

  // ── Build preview (step 2 → 3) ───────────────────────────────────────────
  function buildPreview() {
    if (mapEmail === NONE) return;

    const valid: { email: string; firstName?: string; lastName?: string }[] = [];
    let invalid = 0;

    for (const row of rows) {
      const email = (row[mapEmail] ?? "").trim();
      if (!email || !email.includes("@")) {
        invalid++;
        continue;
      }
      valid.push({
        email,
        firstName: mapFirst !== NONE ? (row[mapFirst] ?? "").trim() || undefined : undefined,
        lastName: mapLast !== NONE ? (row[mapLast] ?? "").trim() || undefined : undefined,
      });
    }

    setValidRows(valid);
    setInvalidCount(invalid);
    setImportStep("preview");
  }

  // ── Final import ─────────────────────────────────────────────────────────
  function handleImport() {
    if (validRows.length === 0 || !selectedListId) return;
    startTransition(async () => {
      await addSubscribers(selectedListId, validRows);
      const subs = await getListSubscribers(selectedListId);
      setSubscribers(subs as Subscriber[]);
      closeImport();
      router.refresh();
    });
  }

  function closeImport() {
    setImportOpen(false);
    setImportStep("upload");
    setFileName("");
    setColumns([]);
    setRows([]);
    setMapEmail(NONE);
    setMapFirst(NONE);
    setMapLast(NONE);
    setValidRows([]);
    setInvalidCount(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Create list ───────────────────────────────────────────────────────────
  function handleCreateList() {
    if (!newListName) return;
    startTransition(async () => {
      const newId = await createEmailList({ name: newListName, description: newListDesc || undefined });
      setNewListOpen(false);
      setNewListName("");
      setNewListDesc("");
      setSelectedListId(newId);
      router.refresh();
    });
  }

  const selectedList = lists.find((l) => l.id === selectedListId);

  // ── Column selector helper ────────────────────────────────────────────────
  function ColSelect({
    label,
    value,
    onChange,
    required,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    required?: boolean;
  }) {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="— skip —" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>— skip —</SelectItem>
            {columns.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* ── List sidebar ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Your Lists</p>
          <Button size="sm" variant="outline" onClick={() => setNewListOpen(true)}>
            <Plus className="size-3" />
            New List
          </Button>
        </div>
        {lists.length === 0 && (
          <p className="text-sm text-muted-foreground">No lists yet.</p>
        )}
        {lists.map((l) => (
          <button
            key={l.id}
            onClick={() => setSelectedListId(l.id)}
            className={`w-full text-left rounded-lg border p-3 transition-colors hover:bg-muted ${
              selectedListId === l.id ? "bg-muted border-primary" : ""
            }`}
          >
            <p className="font-medium text-sm">{l.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {l.subscriberCount} subscribers
            </p>
          </button>
        ))}
      </div>

      {/* ── Subscriber table ──────────────────────────────────────────────── */}
      <div className="space-y-4">
        {selectedList ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{selectedList.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedList.subscriberCount} subscribers
                  {selectedList.description && ` · ${selectedList.description}`}
                </p>
              </div>
              <Button onClick={() => setImportOpen(true)}>
                <Upload className="size-4" />
                Import from Excel / CSV
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        No subscribers yet. Import a file to get started.
                      </TableCell>
                    </TableRow>
                  )}
                  {subscribers.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-sm">{s.email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {[s.firstName, s.lastName].filter(Boolean).join(" ") || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={s.status === "subscribed" ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="size-8 mx-auto mb-2 opacity-30" />
              Select or create a list to manage subscribers.
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── New list dialog ───────────────────────────────────────────────── */}
      <Dialog open={newListOpen} onOpenChange={setNewListOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>List Name</Label>
              <Input
                placeholder="e.g. Newsletter Subscribers"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                placeholder="What is this list for?"
                value={newListDesc}
                onChange={(e) => setNewListDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewListOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateList} disabled={isPending || !newListName}>
              Create List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Import dialog ─────────────────────────────────────────────────── */}
      <Dialog open={importOpen} onOpenChange={(o) => { if (!o) closeImport(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="size-5" />
              Import Subscribers
            </DialogTitle>
            <DialogDescription>
              {importStep === "upload" && "Upload an Excel (.xlsx) or CSV file."}
              {importStep === "map" && `Map your columns — ${rows.length} rows detected in "${fileName}".`}
              {importStep === "preview" && `Review before importing to "${selectedList?.name}".`}
            </DialogDescription>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {(["upload", "map", "preview"] as ImportStep[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <span
                  className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    importStep === s
                      ? "bg-primary text-primary-foreground"
                      : ["map", "preview"].indexOf(importStep) > i
                      ? "bg-green-500 text-white"
                      : "bg-muted"
                  }`}
                >
                  {["map", "preview"].indexOf(importStep) > i ? "✓" : i + 1}
                </span>
                <span className={importStep === s ? "text-foreground font-medium" : ""}>
                  {s === "upload" ? "Upload" : s === "map" ? "Map Columns" : "Preview"}
                </span>
                {i < 2 && <span>›</span>}
              </div>
            ))}
          </div>

          {/* ── Step 1: Upload ── */}
          {importStep === "upload" && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-12 cursor-pointer transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/40"
              }`}
            >
              <FileSpreadsheet className="size-10 text-muted-foreground/50" />
              <div className="text-center">
                <p className="font-medium text-sm">Drag & drop your file here</p>
                <p className="text-xs text-muted-foreground mt-1">
                  or click to browse — supports <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.csv</strong>
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          )}

          {/* ── Step 2: Map columns ── */}
          {importStep === "map" && (
            <div className="space-y-4">
              <Alert>
                <FileSpreadsheet className="size-4" />
                <AlertDescription className="text-xs">
                  We detected <strong>{columns.length} columns</strong> and{" "}
                  <strong>{rows.length} rows</strong> in your file. Map each field below.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-3 gap-4">
                <ColSelect
                  label="Email address"
                  value={mapEmail}
                  onChange={setMapEmail}
                  required
                />
                <ColSelect label="First name" value={mapFirst} onChange={setMapFirst} />
                <ColSelect label="Last name" value={mapLast} onChange={setMapLast} />
              </div>

              {/* Raw data preview */}
              <div>
                <p className="text-xs font-medium mb-2 text-muted-foreground">
                  File preview (first 3 rows)
                </p>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {columns.map((c) => (
                          <TableHead key={c} className="text-xs whitespace-nowrap">
                            {c}
                            {c === mapEmail && (
                              <Badge className="ml-1 text-[10px] h-4">email</Badge>
                            )}
                            {c === mapFirst && (
                              <Badge variant="secondary" className="ml-1 text-[10px] h-4">first</Badge>
                            )}
                            {c === mapLast && (
                              <Badge variant="secondary" className="ml-1 text-[10px] h-4">last</Badge>
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.slice(0, 3).map((row, i) => (
                        <TableRow key={i}>
                          {columns.map((c) => (
                            <TableCell key={c} className="text-xs">
                              {row[c] || <span className="text-muted-foreground/40">—</span>}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Preview ── */}
          {importStep === "preview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded-lg border p-3 bg-green-50 dark:bg-green-950/20">
                  <CheckCircle className="size-5 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                      {validRows.length} valid
                    </p>
                    <p className="text-xs text-green-600/80">Ready to import</p>
                  </div>
                </div>
                {invalidCount > 0 && (
                  <div className="flex items-center gap-3 rounded-lg border p-3 bg-amber-50 dark:bg-amber-950/20">
                    <AlertTriangle className="size-5 text-amber-600" />
                    <div>
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                        {invalidCount} skipped
                      </p>
                      <p className="text-xs text-amber-600/80">Missing or invalid email</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>First Name</TableHead>
                      <TableHead>Last Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validRows.slice(0, 8).map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="text-sm font-medium">{r.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.firstName ?? "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.lastName ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                    {validRows.length > 8 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-2">
                          … and {validRows.length - 8} more
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              {importStep !== "upload" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setImportStep(importStep === "preview" ? "map" : "upload")
                  }
                >
                  Back
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={closeImport}>
                <X className="size-3" />
                Cancel
              </Button>
            </div>

            <div>
              {importStep === "map" && (
                <Button onClick={buildPreview} disabled={mapEmail === NONE}>
                  Preview Import →
                </Button>
              )}
              {importStep === "preview" && (
                <Button onClick={handleImport} disabled={isPending || validRows.length === 0}>
                  {isPending
                    ? "Importing..."
                    : `Import ${validRows.length} Subscribers`}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
