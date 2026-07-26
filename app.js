"use strict";

console.log("Radarune production entrypoint yükleniyor.");

process.on("uncaughtException", (error) => {
  console.error("Radarune beklenmeyen bir hatayla durdu.");
  console.error(error instanceof Error ? error.message : "Bilinmeyen process hatası.");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Radarune yakalanmamış bir async hatayla durdu.");
  console.error(reason instanceof Error ? reason.message : "Bilinmeyen async hatası.");
  process.exit(1);
});

void import("./server.js").catch((error) => {
  console.error("Radarune server giriş noktası başlatılamadı.");
  console.error(error instanceof Error ? error.message : "Bilinmeyen server başlangıç hatası.");
  process.exit(1);
});
