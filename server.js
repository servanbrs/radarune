const port = Number.parseInt(process.env.PORT ?? "3000", 10) || 3000;
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
process.env.NODE_ENV = "production";

async function startServer() {
  const [{ createServer }, nextModule] = await Promise.all([import("node:http"), import("next")]);
  const nextFactory = nextModule.default;
  const app = nextFactory({ dev: false, hostname, port });
  await app.prepare();
  const handle = app.getRequestHandler();
  createServer((request, response) => handle(request, response)).listen(port, hostname, () => {
    console.log(`Radarune production server listening on ${hostname}:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Radarune production server başlatılamadı.");
  console.error(error instanceof Error ? error.message : "Bilinmeyen server hatası.");
  process.exit(1);
});
