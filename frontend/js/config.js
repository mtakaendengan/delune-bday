export const APP_CONFIG = Object.freeze({
  // Ganti setelah Apps Script dideploy sebagai Web App.
  // Contoh: https://script.google.com/macros/s/AKfycb.../exec
  webAppUrl: "https://script.google.com/macros/s/AKfycbynnWkjhsFRtmCY2Ydj3YO2KQg3NX-FT_HvPIHR3rac_oE8HHZU-rz1T5fuRnMT7tncWA/exec",

  // Identifier publik, bukan secret. Samakan dengan PUBLIC_ACCESS_KEY
  // yang ditampilkan saat setupProject() dijalankan.
  publicAccessKey: "birthday-19c4cc4fee5044ab9ba0",

  requestTimeoutMs: 12000,
  wishesPerPage: 8,
  maxUploadBytes: 3 * 1024 * 1024,
  allowedUploadTypes: ["image/jpeg", "image/png", "image/webp"],

  // Data fallback akan tampil sebelum backend dihubungkan.
  // Jam 15.00-18.00 WITA adalah nilai awal karena waktu acara belum diberikan.
  fallback: {
    siteTitle: "Undangan Ulang Tahun Kania",
    celebrantName: "Kania De Lune Takaendengan",
    nickname: "Kania",
    age: 0,
    eventStart: "2026-07-19T15:00:00+08:00",
    eventEnd: "2026-07-19T18:00:00+08:00",
    timezone: "Asia/Makassar",
    dateLabel: "Minggu, 19 Juli 2026",
    timeLabel: "15.00 - 18.00 WITA",
    venue: "Rumah Poli",
    address: "Politeknik Indah Blok E-1",
    mapUrl: "https://www.google.com/maps/place/Rumah+Poli/@1.5078659,124.8897013,817m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3287a1dafefa0abb:0xc75a216aa754d8f6!8m2!3d1.5078605!4d124.8922762!16s%2Fg%2F11sf423ls3?entry=ttu&g_ep=EgoyMDI2MDcxMi4wIKXMDSoASAFQAw%3D%3D",
    greeting: "Dengan penuh sukacita, kami mengundang Anda untuk hadir dan merayakan hari istimewa Kania bersama kami.",
    storyTitle: "A little celebration",
    storyText: "Kehadiran dan doa baik Anda akan menjadi hadiah yang sangat berarti bagi Kania dan keluarga.",
    dressCode: "Bebas, rapi, dan ceria",
    hostName: "Keluarga Takaendengan",
    closingMessage: "Sampai bertemu di hari bahagia Kania!",
    themePrimary: "#A72C70",
    themeSecondary: "#C83B82",
    themeAccent: "#F05FA5",
    heroImage: "./assets/images/hero.webp",
    portraitImage: "./assets/images/portrait.webp",
    musicEnabled: false,
    musicUrl: "",
    giftEnabled: false,
    giftTitle: "Birthday Gift",
    giftDescription: "Doa dan kehadiran Anda sudah lebih dari cukup.",
    giftAccountName: "",
    giftAccountNumber: "",
    giftBank: "",
    uploadEnabled: true
  }
});
