import PDFDocument from "pdfkit";

interface InvoiceData {
    invoiceNumber: string;
    date: Date;
    amount: number | string;
    userName: string;
    userEmail: string;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        // Modern A4 Size (595.28 x 841.89)
        const doc = new PDFDocument({size: "A4", margin: 50});
        const buffers: Buffer[] = [];

        doc.on("data", (buffer) => buffers.push(buffer));
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        doc.on("error", reject);

        const colors = {
            accent: "#4F46E5",      // Indigo 600 (Modern Brand Accent)
            textDark: "#0F172A",    // Slate 900 (High Contrast Text)
            textMuted: "#64748B",   // Slate 500 (Secondary Text)
            border: "#E2E8F0",      // Slate 200 (Clean Dividers)
            bgLight: "#F8FAFC",     // Slate 50  (Subtle Backgrounds)
        };

        const companyName = process.env.NEXT_PUBLIC_NINJAZ || "Ninjaz Lab Sdn Bhd2 ";
        const companyAddress = process.env.NEXT_PUBLIC_NINJAZ_ADDRESS || "Kuala Lumpur, Malaysia";

        const formattedDate = data.date.toLocaleDateString("en-MY", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });

        const amountStr = Number(data.amount).toFixed(2);

        // ==========================================
        // 1. TOP ACCENT BAR (SaaS Branding)
        // ==========================================
        doc.rect(0, 0, 595.28, 8).fillColor(colors.accent).fill();

        // ==========================================
        // 2. HEADER SECTION
        // ==========================================

        // Left: Company Info
        doc.fontSize(18).font("Helvetica-Bold").fillColor(colors.textDark).text(companyName, 50, 60);
        doc.fontSize(10).font("Helvetica").fillColor(colors.textMuted).text(companyAddress, 50, 85);

        // Right: BIG INVOICE Text & Number
        doc.fontSize(24).font("Helvetica-Bold").fillColor(colors.accent).text("INVOICE", 0, 60, {
            align: "right",
            width: 545
        });
        doc.fontSize(10).font("Helvetica-Bold").fillColor(colors.textMuted).text(`${data.invoiceNumber}`, 0, 88, {
            align: "right",
            width: 545
        });

        // Divider Line
        doc.moveTo(50, 130).lineTo(545, 130).lineWidth(1).strokeColor(colors.border).stroke();

        // ==========================================
        // 3. META DATA GRID (3 Columns)
        // ==========================================
        const gridY = 160;

        // Column 1: Billed To
        doc.fontSize(9).font("Helvetica-Bold").fillColor(colors.textMuted).text("BILLED TO", 50, gridY);
        doc.fontSize(12).font("Helvetica-Bold").fillColor(colors.textDark).text(data.userName, 50, gridY + 15);
        doc.fontSize(10).font("Helvetica").fillColor(colors.textMuted).text(data.userEmail, 50, gridY + 32);

        // Column 2: Issue Date
        doc.fontSize(9).font("Helvetica-Bold").fillColor(colors.textMuted).text("ISSUE DATE", 300, gridY);
        doc.fontSize(12).font("Helvetica-Bold").fillColor(colors.textDark).text(formattedDate, 300, gridY + 15);

        // Column 3: Amount Due
        doc.fontSize(9).font("Helvetica-Bold").fillColor(colors.textMuted).text("AMOUNT DUE", 430, gridY);
        doc.fontSize(12).font("Helvetica-Bold").fillColor(colors.accent).text(`MYR ${amountStr}`, 430, gridY + 15);


        // ==========================================
        // 4. ITEMS TABLE
        // ==========================================
        const tableTop = 260;

        // Table Header Background (Rounded pill-like feel)
        doc.rect(50, tableTop, 495, 28).fillColor(colors.bgLight).fill();

        // Table Header Text
        const thY = tableTop + 10;
        doc.fontSize(9).font("Helvetica-Bold").fillColor(colors.textMuted);
        doc.text("DESCRIPTION", 70, thY);
        doc.text("QTY", 370, thY, {width: 30, align: "center"});
        doc.text("AMOUNT", 430, thY, {width: 100, align: "right"});

        // Table Item Row
        const trY = tableTop + 50;
        doc.fontSize(11).font("Helvetica-Bold").fillColor(colors.textDark).text("Wallet Top-Up", 70, trY);
        doc.fontSize(9).font("Helvetica").fillColor(colors.textMuted).text("Manual funds transfer to platform wallet.", 70, trY + 16);

        doc.fontSize(11).font("Helvetica").fillColor(colors.textDark).text("1", 370, trY, {width: 30, align: "center"});
        doc.text(`MYR ${amountStr}`, 430, trY, {width: 100, align: "right"});

        // Bottom Table Border
        doc.moveTo(50, trY + 45).lineTo(545, trY + 45).lineWidth(1).strokeColor(colors.border).stroke();


        // ==========================================
        // 5. TOTALS SECTION
        // ==========================================
        const totalsTop = trY + 70;

        // Subtotal
        doc.fontSize(10).font("Helvetica").fillColor(colors.textMuted).text("Subtotal", 330, totalsTop, {
            width: 100,
            align: "right"
        });
        doc.font("Helvetica").fillColor(colors.textDark).text(`MYR ${amountStr}`, 445, totalsTop, {
            width: 100,
            align: "right"
        });

        // Thick border before Final Total
        doc.moveTo(350, totalsTop + 25).lineTo(545, totalsTop + 25).lineWidth(1.5).strokeColor(colors.border).stroke();

        // Final Total
        const finalTotalTop = totalsTop + 45;
        doc.fontSize(12).font("Helvetica-Bold").fillColor(colors.textDark).text("Total Due", 330, finalTotalTop, {
            width: 100,
            align: "right"
        });
        doc.fontSize(14).font("Helvetica-Bold").fillColor(colors.accent).text(`MYR ${amountStr}`, 445, finalTotalTop - 1, {
            width: 100,
            align: "right"
        });


        // ==========================================
        // 6. FOOTER BAR
        // ==========================================
        // Full width gray footer at the absolute bottom
        doc.rect(0, 780, 595.28, 65).fillColor(colors.bgLight).fill();

        doc.fontSize(10).font("Helvetica-Bold").fillColor(colors.textDark)
            .text("Thank you for your business!", 0, 765, {align: "center", width: 595.28});

        doc.fontSize(9).font("Helvetica").fillColor(colors.textMuted)
            .text("If you have any questions about this invoice, please contact our support team.", 0, 780, {
                align: "center",
                width: 595.28
            });

        doc.end();
    });
}