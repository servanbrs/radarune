const CUSTOMER_GREETING_PATTERN =
  /^(Merhaba(?:[ \t]+[^,\n]+)?),[ \t]*(?:\n[ \t]*)*/u;

/**
 * Keeps customer e-mail copy conversational and readable by placing the
 * greeting and the message in separate paragraphs. The normalization also
 * upgrades previously saved one-line templates at send time.
 */
export function formatCustomerEmailCopy(value: string) {
  const normalized = value.replaceAll("\r\n", "\n").trim();

  return normalized.replace(CUSTOMER_GREETING_PATTERN, "$1,\n\n");
}
