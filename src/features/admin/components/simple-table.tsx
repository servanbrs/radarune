import type { ReactNode } from "react";

export function SimpleTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white/70">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-[0.18em] text-muted">
            <tr>
              {columns.map((column) => (
                <th className="px-4 py-3 font-semibold" key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr className="border-t border-line" key={index}>
                {row.map((cell, cellIndex) => (
                  <td className="px-4 py-4 align-top" key={cellIndex}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-3 md:hidden">
        {rows.map((row, index) => (
          <article className="rounded-2xl border border-line bg-white p-4" key={index}>
            {row.map((cell, cellIndex) => (
              <div className="py-2" key={cellIndex}>
                <p className="text-xs uppercase tracking-[0.16em] text-muted">
                  {columns[cellIndex]}
                </p>
                <div className="mt-1 text-sm">{cell}</div>
              </div>
            ))}
          </article>
        ))}
      </div>
    </div>
  );
}
