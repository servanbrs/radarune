import type {
  DeliveryStatus,
  DistributionJobStatus,
  DistributionProviderKey,
} from "@/features/distribution-hub/domain/provider";

export const distributionJobStatusLabels: Record<
  DistributionJobStatus,
  string
> = {
  PENDING: "Bekliyor",
  VALIDATING: "Doğrulanıyor",
  QUEUED: "Sırada",
  PROCESSING: "İşleniyor",
  WAITING_PROVIDER: "Sağlayıcı bekleniyor",
  RETRY_SCHEDULED: "Yeniden denenecek",
  SUCCEEDED: "Başarılı",
  PARTIALLY_SUCCEEDED: "Kısmen başarılı",
  FAILED: "Başarısız",
  CANCELLED: "İptal edildi",
  MANUAL_REVIEW: "Manuel inceleme",
};

export const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  NOT_SENT: "Gönderilmedi",
  QUEUED: "Sırada",
  SUBMITTED: "Gönderildi",
  ACCEPTED: "Kabul edildi",
  PROCESSING: "İşleniyor",
  DELIVERED: "Dağıtıldı",
  LIVE: "Yayında",
  REJECTED: "Reddedildi",
  FAILED: "Başarısız",
  TAKEDOWN_PENDING: "Kaldırma bekleniyor",
  TAKEN_DOWN: "Kaldırıldı",
};

export const distributionProviderLabels: Record<
  DistributionProviderKey,
  string
> = {
  ONE_RPM: "ONErpm",
  FUGA: "FUGA",
  SYMPHONIC: "Symphonic",
  REVELATOR: "Revelator",
  INTERNAL: "Radarune",
};

export function getDistributionJobStatusLabel(
  status: DistributionJobStatus,
) {
  return distributionJobStatusLabels[status] ?? status;
}

export function getDeliveryStatusLabel(status: DeliveryStatus) {
  return deliveryStatusLabels[status] ?? status;
}

export function getDistributionProviderLabel(
  provider: DistributionProviderKey,
) {
  return distributionProviderLabels[provider] ?? provider;
}
