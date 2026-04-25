"use client";

import {Dialog, DialogContent, DialogDescription, DialogTitle} from "@/components/ui/dialog";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    url?: string | null;
}

export function DocumentPreviewDialog({open, onOpenChange, title, url}: Props) {
    if (!url) return null;

    // Safely check if the URL points to an image (ignoring query parameters)
    const isImage = /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl w-[95vw] p-0 overflow-hidden bg-background">
                <DialogTitle className="sr-only">{title}</DialogTitle>
                <DialogDescription className="sr-only">Preview of {title}</DialogDescription>

                <div className="w-full h-[85vh] flex items-center justify-center p-2 md:p-6 bg-muted/20">
                    {isImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={url}
                            alt={title}
                            className="max-w-full max-h-full object-contain drop-shadow-xl rounded-md"
                        />
                    ) : (
                        <iframe
                            src={url}
                            className="w-full h-full border-0 rounded-xl bg-white shadow-inner"
                            title={title}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}