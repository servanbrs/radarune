import type { ReactNode } from "react";

type SimpleTableProps = {
  columns: string[];
  rows: ReactNode[][];
  emptyMessage?: string;
};

export function SimpleTable({
  columns,
  rows,
  emptyMessage = "Gösterilecek kayıt bulunamadı.",
}: SimpleTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-3xl border border-line bg-white/70 px-5 py-10 text-center">
        <p className="text-sm text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-3xl border border-line bg-white/70">
      {/* Masaüstü tablo */}
      <div className="hidden w-full overflow-x-auto md:block">
        <table className="w-full min-w-[840px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-[0.14em] text-muted">
            <tr>
              {columns.map((column, columnIndex) => (
                <th
                  className="whitespace-nowrap px-4 py-3 font-semibold"
                  key={`${column}-${columnIndex}`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                className="border-t border-line transition hover:bg-surface/70"
                key={`row-${rowIndex}`}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    className="max-w-[280px] px-4 py-4 align-top"
                    key={`cell-${rowIndex}-${cellIndex}`}
                  >
                    <div className="min-w-0 break-words">{cell}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobil kart görünümü */}
      <div className="grid gap-3 p-3 md:hidden">
        {rows.map((row, rowIndex) => (
          <article
            className="min-w-0 rounded-2xl border border-line bg-white p-4"
            key={`mobile-row-${rowIndex}`}
          >
            {row.map((cell, cellIndex) => (
              <div
                className="border-b border-line py-3 last:border-b-0"
                key={`mobile-cell-${rowIndex}-${cellIndex}`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  {columns[cellIndex] ?? `Alan ${cellIndex + 1}`}
                </p>

                <div className="mt-1 min-w-0 break-words text-sm text-foreground">
                  {cell}
                </div>
              </div>
            ))}
          </article>
        ))}
      </div>
    </div>
  );
}