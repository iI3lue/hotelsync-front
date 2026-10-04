"use client";

import { useEffect, useRef, useState } from "react";
import {
  fetchFolioByBooking,
  fetchHotelByIdClient,
  type BillingFolio,
} from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import Money from "@/components/Money";
import { useCurrency } from "@/components/CurrencyProvider";
import Spinner from "@/components/Spinner";

type InvoiceState =
  | { status: "loading" }
  | { status: "pending" }
  | { status: "ready"; folio: BillingFolio }
  | { status: "error"; message: string };

const MAX_ATTEMPTS = 8;
const RETRY_MS = 2000;

/**
 * Factura final de una reserva tras el check-out (demo de billing).
 * El cierre es async (consumer de `checkout.completed`), así que consulta
 * el folio por booking y espera la factura con reintentos.
 */
export default function InvoicePanel({ bookingId }: { bookingId: string }) {
  const [state, setState] = useState<InvoiceState>({ status: "loading" });
  const { currency } = useCurrency();
  const attempt = useRef(0);

  useEffect(() => {
    let cancelled = false;
    attempt.current = 0;
    setState({ status: "loading" });

    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const load = async () => {
      for (;;) {
        attempt.current += 1;
        try {
          const folio = await fetchFolioByBooking(bookingId);
          if (cancelled) return;
          if (folio.invoice) {
            setState({ status: "ready", folio });
            return;
          }
          if (attempt.current >= MAX_ATTEMPTS) {
            setState({
              status: "error",
              message:
                "El folio está abierto pero la factura todavía no se emitió. Reintentá en unos segundos.",
            });
            return;
          }
          setState({ status: "pending" });
        } catch (err) {
          if (cancelled) return;
          if (attempt.current >= MAX_ATTEMPTS) {
            setState({
              status: "error",
              message:
                err instanceof Error ? err.message : "No se pudo cargar la factura",
            });
            return;
          }
          setState({ status: "pending" });
        }
        await sleep(RETRY_MS);
        if (cancelled) return;
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (state.status === "loading" || state.status === "pending") {
    return (
      <p role="status" className="text-sm text-gray-600 dark:text-gray-300">
        <Spinner label="Generando factura…" /> Buscando la factura de billing…
      </p>
    );
  }

  if (state.status === "error") {
    return (
      <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
        {state.message}
      </p>
    );
  }

  const { folio } = state;
  const invoice = folio.invoice;
  if (!invoice) return null;

  return (
    <InvoiceReady folio={folio} />
  );
}

function InvoiceReady({ folio }: { folio: BillingFolio }) {
  const invoice = folio.invoice;
  if (!invoice) return null;
  const { currency } = useCurrency();
  const [hotelName, setHotelName] = useState<string>("HotelSync");
  const [generating, setGenerating] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchHotelByIdClient(folio.hotel_id)
      .then((hotel) => {
        if (!cancelled) setHotelName(hotel.name);
      })
      .catch(() => {
        // Sin nombre del hotel igual se genera el PDF.
      });
    return () => {
      cancelled = true;
    };
  }, [folio.hotel_id]);

  const downloadPdf = async () => {
    setGenerating(true);
    setPdfError(null);
    try {
      const { buildInvoicePdf } = await import("@/lib/invoice-pdf");
      const doc = buildInvoicePdf(folio, hotelName);
      doc.save(`factura-${invoice.invoice_number}.pdf`);
    } catch (err) {
      setPdfError(
        err instanceof Error ? err.message : "No se pudo generar el PDF"
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-1 text-lg font-semibold">
        Factura {invoice.invoice_number}
      </h3>
      <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
        Emitida el {formatDate(String(invoice.issued_at).slice(0, 10))} · Folio{" "}
        {folio.status === "closed" ? "cerrado" : folio.status} · Moneda{" "}
        {invoice.currency}
      </p>
      <table className="mb-3 w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 dark:text-gray-400">
            <th className="py-1 pr-2 font-medium">Concepto</th>
            <th className="py-1 pr-2 font-medium">Categoría</th>
            <th className="py-1 text-right font-medium">Monto</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {folio.charges.map((charge) => (
            <tr key={charge.charge_id}>
              <td className="py-1 pr-2">{charge.concept}</td>
              <td className="py-1 pr-2 text-gray-500 dark:text-gray-400">
                {charge.category}
              </td>
              <td className="py-1 text-right tabular-nums">
                <Money amountCOP={charge.amount} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-gray-600 dark:text-gray-300">Subtotal:</dt>
          <dd className="tabular-nums">
            <Money amountCOP={invoice.subtotal} />
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-gray-600 dark:text-gray-300">
            Impuesto ({Math.round(Number(invoice.tax_rate) * 100)}%):
          </dt>
          <dd className="tabular-nums">
            <Money amountCOP={invoice.tax_amount} />
          </dd>
        </div>
        <div className="flex justify-between gap-2 text-base font-bold">
          <dt>Total:</dt>
          <dd className="tabular-nums">
            <Money amountCOP={invoice.total} />
          </dd>
        </div>
      </dl>
      {currency !== "COP" ? (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Montos de referencia en {currency}; la factura es en {invoice.currency}.
        </p>
      ) : null}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => void downloadPdf()}
          disabled={generating}
          className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 touch-manipulation disabled:opacity-50"
        >
          {generating ? "Generando PDF…" : "Descargar factura (PDF)"}
        </button>
        {pdfError ? (
          <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
            {pdfError}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          El PDF siempre sale en {invoice.currency}.
        </p>
      </div>
    </div>
  );
}
