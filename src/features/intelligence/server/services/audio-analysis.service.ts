import "server-only";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Prisma } from "@/generated/prisma/client";
import { stableHash } from "@/features/intelligence/lib/hash";
import { intelligenceRepository } from "@/features/intelligence/server/repositories/intelligence.repository";

const execFileAsync = promisify(execFile);

type ReleaseDetail = NonNullable<Awaited<ReturnType<typeof intelligenceRepository.findReleaseDetail>>>;
type ReleaseTrack = ReleaseDetail["tracks"][number];

type FfprobeStream = {
  codec_name?: string;
  sample_rate?: string;
  bits_per_sample?: number;
  channels?: number;
  channel_layout?: string;
  bit_rate?: string;
};

type FfprobeFormat = {
  format_name?: string;
  duration?: string;
  size?: string;
  bit_rate?: string;
};

type FfprobeOutput = {
  streams?: FfprobeStream[];
  format?: FfprobeFormat;
};

export class AudioAnalysisService {
  async analyze(release: ReleaseDetail, track: ReleaseTrack) {
    const upload = track.uploads.find((item) => item.id === track.audioUploadId && item.kind === "AUDIO");
    if (!upload) {
      return null;
    }

    const base = {
      organizationId: release.organizationId,
      releaseId: release.id,
      trackId: track.id,
      uploadId: upload.id,
      inputHash: stableHash({
        uploadId: upload.id,
        checksumSha256: upload.checksumSha256,
        mimeType: upload.mimeType,
        byteSize: upload.byteSize.toString(),
      }),
      fileSizeBytes: upload.byteSize,
    };

    const issues: Prisma.AudioAnalysisIssueUncheckedCreateWithoutAnalysisInput[] = [];

    if (!["audio/wav", "audio/x-wav", "audio/flac", "audio/x-flac"].includes(upload.mimeType)) {
      issues.push({
        code: "UNSUPPORTED_CODEC",
        severity: "ERROR",
        blocking: true,
        message: "Ses dosyası WAV veya FLAC olmalıdır.",
      });
    }

    const filePath = upload.storageKey.startsWith("/") ? upload.storageKey : null;
    if (!filePath) {
      return intelligenceRepository.createAudioAnalysis({
        ...base,
        status: "UNSUPPORTED",
        decodeError: "Storage adapter local dosya yolu sağlamadığı için ffprobe analizi çalıştırılmadı.",
      }, issues);
    }

    try {
      const { stdout } = await execFileAsync("ffprobe", [
        "-v",
        "error",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        filePath,
      ]);
      const parsed = JSON.parse(stdout) as FfprobeOutput;
      const stream = parsed.streams?.[0];
      const durationMs = parsed.format?.duration ? Math.round(Number(parsed.format.duration) * 1000) : null;
      const sampleRate = stream?.sample_rate ? Number(stream.sample_rate) : null;
      const bitDepth = stream?.bits_per_sample ?? null;
      const channels = stream?.channels ?? null;

      if (sampleRate !== null && sampleRate < 44100) {
        issues.push({
          code: "SAMPLE_RATE_TOO_LOW",
          severity: "WARNING",
          blocking: false,
          message: "Sample rate 44.1 kHz altında görünüyor.",
        });
      }
      if (bitDepth !== null && bitDepth > 0 && bitDepth < 16) {
        issues.push({
          code: "BIT_DEPTH_TOO_LOW",
          severity: "WARNING",
          blocking: false,
          message: "Bit depth 16-bit altında görünüyor.",
        });
      }
      if (channels === 1) {
        issues.push({
          code: "MONO_AUDIO",
          severity: "INFO",
          blocking: false,
          message: "Ses dosyası mono görünüyor.",
        });
      }

      return intelligenceRepository.createAudioAnalysis({
        ...base,
        status: "COMPLETED",
        codec: stream?.codec_name ?? null,
        container: parsed.format?.format_name ?? null,
        durationMs,
        sampleRate,
        bitDepth,
        bitrate: stream?.bit_rate ? Number(stream.bit_rate) : parsed.format?.bit_rate ? Number(parsed.format.bit_rate) : null,
        channels,
        channelLayout: stream?.channel_layout ?? null,
      }, issues);
    } catch (error) {
      issues.push({
        code: "CORRUPT_AUDIO",
        severity: "CRITICAL",
        blocking: true,
        message: "Ses dosyası çözümlenemedi veya ffprobe çalıştırılamadı.",
      });
      return intelligenceRepository.createAudioAnalysis({
        ...base,
        status: "FAILED",
        corruptFile: true,
        decodeError: error instanceof Error ? error.message : "Audio analiz hatası.",
      }, issues);
    }
  }
}

export const audioAnalysisService = new AudioAnalysisService();
