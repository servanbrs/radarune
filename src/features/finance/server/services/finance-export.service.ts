import "server-only";
import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { formatMinorMoney } from "@/features/finance/lib/formatters";
import { financialStatementService } from "@/features/finance/server/services/financial-statement.service";
import { royaltyEngineService } from "@/features/finance/server/services/royalty-engine.service";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";

function createCsvBuffer(rows: Array<Record<string, string | number>>) {
  const headers = Object.keys(rows[0] ?? {});
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = sanitizeSpreadsheetValue(row[header]);
          return `"${value.replaceAll('"', '""')}"`;
        })
        .join(","),
    ),
  ];

  return Buffer.from(lines.join("\n"), "utf8");
}

function sanitizeSpreadsheetValue(value: string | number | undefined) {
  const text = String(value ?? "");

  if (/^[=+\-@]/.test(text)) {
    return `'${text}`;
  }

  return text;
}

function sanitizeSpreadsheetRows(rows: Array<Record<string, string | number>>) {
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, sanitizeSpreadsheetValue(value)]),
    ),
  );
}

async function createXlsxBuffer(
  rows: Array<Record<string, string | number>>,
  sheetName: string,
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  const headers = Object.keys(rows[0] ?? {});

  worksheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: Math.min(Math.max(header.length + 4, 14), 32),
  }));

  for (const row of sanitizeSpreadsheetRows(rows)) {
    worksheet.addRow(row);
  }

  worksheet.getRow(1).font = { bold: true };
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export class FinanceExportService {
  async exportStatements(
    actor: FinanceActorContext,
    format: "csv" | "xlsx" | "pdf",
  ) {
    const statements = await financialStatementService.listStatements(actor);
    const rows = statements.map((statement) => ({
      statementId: statement.id,
      subjectType: statement.subjectType,
      beneficiary:
        statement.artist?.name ??
        statement.label?.name ??
        statement.beneficiaryUser?.name ??
        "",
      currencyCode: statement.currencyCode,
      openingBalance: formatMinorMoney(
        statement.openingBalanceMinor,
        statement.currencyCode,
      ),
      totalRevenue: formatMinorMoney(statement.totalRevenueMinor, statement.currencyCode),
      adjustments: formatMinorMoney(statement.adjustmentsMinor, statement.currencyCode),
      withdrawals: formatMinorMoney(statement.withdrawalsMinor, statement.currencyCode),
      closingBalance: formatMinorMoney(statement.closingBalanceMinor, statement.currencyCode),
      periodStart: statement.periodStart.toISOString(),
      periodEnd: statement.periodEnd.toISOString(),
    }));

    if (format === "csv") {
      return {
        contentType: "text/csv; charset=utf-8",
        fileName: "financial-statements.csv",
        body: createCsvBuffer(rows),
      };
    }

    if (format === "xlsx") {
      return {
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        fileName: "financial-statements.xlsx",
        body: await createXlsxBuffer(rows, "Statements"),
      };
    }

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([842, 595]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const titleFont = await pdf.embedFont(StandardFonts.HelveticaBold);

    page.drawText("Radarune Financial Statements", {
      x: 40,
      y: 555,
      font: titleFont,
      size: 18,
    });

    let y = 520;
    for (const row of rows.slice(0, 24)) {
      page.drawText(
        `${row.beneficiary} | ${row.currencyCode} | ${row.closingBalance} | ${row.periodStart.slice(0, 10)} - ${row.periodEnd.slice(0, 10)}`,
        {
          x: 40,
          y,
          font,
          size: 10,
        },
      );
      y -= 18;
    }

    return {
      contentType: "application/pdf",
      fileName: "financial-statements.pdf",
      body: Buffer.from(await pdf.save()),
    };
  }

  async exportRoyaltyReport(
    actor: FinanceActorContext,
    reportId: string,
    format: "csv" | "xlsx" | "pdf",
  ) {
    const report = await royaltyEngineService.getReportDetail(actor, reportId);

    if (!report) {
      throw new Error("Royalty raporu bulunamadı.");
    }

    const rows = report.lines.map((line) => ({
      participantName: line.participantName,
      splitRole: line.splitRole,
      trackTitle: line.trackTitle,
      releaseTitle: line.releaseTitle,
      platformName: line.platformName,
      storeName: line.storeName,
      countryCode: line.countryCode,
      amount: formatMinorMoney(line.beneficiaryAmountMinor, report.reportingCurrency),
    }));

    if (format === "csv") {
      return {
        contentType: "text/csv; charset=utf-8",
        fileName: `royalty-report-${reportId}.csv`,
        body: createCsvBuffer(rows),
      };
    }

    if (format === "xlsx") {
      return {
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        fileName: `royalty-report-${reportId}.xlsx`,
        body: await createXlsxBuffer(rows, "Royalty Report"),
      };
    }

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([842, 595]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const titleFont = await pdf.embedFont(StandardFonts.HelveticaBold);

    page.drawText("Radarune Royalty Report", {
      x: 40,
      y: 555,
      font: titleFont,
      size: 18,
    });

    page.drawText(
      `${report.periodStart.toISOString().slice(0, 10)} - ${report.periodEnd.toISOString().slice(0, 10)} | ${report.reportingCurrency}`,
      {
        x: 40,
        y: 532,
        font,
        size: 10,
      },
    );

    let y = 510;
    for (const row of rows.slice(0, 22)) {
      page.drawText(
        `${row.participantName} | ${row.trackTitle} | ${row.amount}`,
        {
          x: 40,
          y,
          font,
          size: 10,
        },
      );
      y -= 18;
    }

    return {
      contentType: "application/pdf",
      fileName: `royalty-report-${reportId}.pdf`,
      body: Buffer.from(await pdf.save()),
    };
  }
}

export const financeExportService = new FinanceExportService();
