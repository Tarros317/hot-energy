/** Structured data injected as a plain script tag — no client JS involved. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // The payload is built in our own code from typed literals, never from
      // user input, so serialising it directly is safe.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
