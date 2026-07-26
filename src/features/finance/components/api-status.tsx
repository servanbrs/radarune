type ApiStatusProps = {
  error: string | null;
  success: string | null;
};

export function ApiStatus({ error, success }: ApiStatusProps) {
  if (error) {
    return (
      <p className="rounded-2xl border border-danger/20 bg-danger/8 px-4 py-3 text-sm text-danger">
        {error}
      </p>
    );
  }

  if (success) {
    return (
      <p className="rounded-2xl border border-accent/20 bg-accent/8 px-4 py-3 text-sm text-accent">
        {success}
      </p>
    );
  }

  return null;
}
