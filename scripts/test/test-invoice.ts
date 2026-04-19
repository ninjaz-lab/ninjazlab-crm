import fs from "fs";
import {generateInvoicePDF} from "@/lib/utils/invoice";
import path from "node:path";

async function testInvoice() {
    console.log("⏳ Generating invoice...");

    const mockData = {
        invoiceNumber: "INV-20260418-TEST99",
        date: new Date(),
        amount: 250.00,
        userName: "Demo",
        userEmail: "demo@example.com"
    };

    try {
        const pdfBuffer = await generateInvoicePDF(mockData);

        const outputPath = path.join(process.cwd(), "test-invoice.pdf");
        fs.writeFileSync(outputPath, pdfBuffer);

        console.log(`✅ Success! Invoice saved to: ${outputPath}`);
    } catch (error) {
        console.error("❌ Failed to generate PDF:", error);
    }
}

void testInvoice();