// Util format murni, aman untuk client dan server.

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** 50000 -> "Rp 50.000" */
export function formatRupiah(amount: number): string {
  if (amount === 0) return "Gratis";
  return rupiahFormatter.format(amount);
}

/** 90 -> "1 jam 30 menit" */
export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} menit`;
  if (minutes === 0) return `${hours} jam`;
  return `${hours} jam ${minutes} menit`;
}

/** "0812-3456-7890" / "+62 812..." -> "6281234567890" (format internasional tanpa "+"). */
export function normalizeWhatsapp(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

/** "6281234567890" -> "https://wa.me/6281234567890" */
export function whatsappLink(normalizedNumber: string): string {
  return `https://wa.me/${normalizedNumber}`;
}
