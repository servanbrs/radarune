type ValidationIssue = {
  id?: string;
  fieldPath: string;
  message: string;
  severity: "ERROR" | "WARNING" | "INFO" | "CRITICAL";
};

export function ValidationSummary({ issues }: { issues: ValidationIssue[] }) {
  if (issues.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
        Yayın doğrulama hatası bulunmuyor.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-900">Düzeltilmesi gereken alanlar</p>
      <ul className="mt-3 space-y-2 text-sm text-amber-900">
        {issues.map((issue) => (
          <li className="flex gap-2" key={`${issue.fieldPath}-${issue.message}`}>
            <span className="font-semibold">{issue.severity}</span>
            <span>{issue.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
