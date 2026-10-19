import { expect, it } from "vitest";
import { readSse } from "@/lib/chat/sse";
it("frames CRLF events and split Bangla bytes without losing text", async () => {
  const bytes = new TextEncoder().encode(
    ': heartbeat\r\ndata: {"text":"বাংলা"}\r\n\r\ndata: first\ndata: second\n\n',
  );
  let offset = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(c) {
      if (offset >= bytes.length) c.close();
      else c.enqueue(bytes.slice(offset, ++offset));
    },
  });
  const events = [];
  for await (const event of readSse(stream, new AbortController().signal))
    events.push(event.data);
  expect(events).toEqual(['{"text":"বাংলা"}', "first\nsecond"]);
});
