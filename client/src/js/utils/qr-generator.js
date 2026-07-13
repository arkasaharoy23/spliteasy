export function renderQrCode(containerEl, text) {
  containerEl.innerHTML = "";

  if (typeof QRCode === "undefined") {
    containerEl.textContent = "QR code library failed to load";
    return;
  }

  new QRCode(containerEl, {
    text,
    width: 200,
    height: 200,
    colorDark: "#1E293B",
    colorLight: "#FFFFFF",
    correctLevel: QRCode.CorrectLevel.M
  });
}