import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate, formatMoney } from "@/lib/format";
import type { BillingFolio } from "@/lib/api-client";

/**
 * Arma el PDF de una factura (siempre en COP, la moneda de emisión).
 * Función pura: recibe datos, devuelve el documento listo para guardar.
 */
export function buildInvoicePdf(
  folio: BillingFolio,
  hotelName: string
): jsPDF {
  const invoice = folio.invoice;
  if (!invoice) {
    throw new Error("El folio todavía no tiene factura emitida");
  }

  const doc = new jsPDF();
  const cop = (value: number | string) => formatMoney(value, "COP");

  doc.setFontSize(20);
  doc.text("HotelSync", 14, 20);
  doc.setFontSize(12);
  doc.text(hotelName, 14, 28);
  doc.setFontSize(16);
  doc.text(`Factura ${invoice.invoice_number}`, 14, 40);
  doc.setFontSize(10);
  doc.text(
    `Emitida el ${formatDate(String(invoice.issued_at).slice(0, 10))} · Folio ${folio.status === "closed" ? "cerrado" : folio.status}`,
    14,
    47
  );
  doc.text(`Reserva: ${folio.booking_id}`, 14, 53);
  doc.text(`Huésped: ${folio.guest_id}`, 14, 59);

  autoTable(doc, {
    startY: 66,
    head: [["Concepto", "Categoría", "Monto"]],
    body: folio.charges.map((charge) => [
      charge.concept,
      charge.category,
      cop(charge.amount),
    ]),
    foot: [
      ["Subtotal", "", cop(invoice.subtotal)],
      [
        `Impuesto (${Math.round(Number(invoice.tax_rate) * 100)}%)`,
        "",
        cop(invoice.tax_amount),
      ],
      ["Total", "", cop(invoice.total)],
    ],
  });

  const endY = (doc as unknown as { lastAutoTable: { finalY: number } })
    .lastAutoTable.finalY;
  doc.setFontSize(10);
  doc.text(`Moneda: ${invoice.currency}`, 14, endY + 10);
  doc.text("Documento de demostración generado por HotelSync.", 14, endY + 17);

  return doc;
}
