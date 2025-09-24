const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const resultDiv = document.getElementById('result');
const historyTable = document.getElementById('historyTable');
const thresholdSlider = document.getElementById('threshold');
const thresholdValue = document.getElementById('thresholdValue');
const cameraSelect = document.getElementById('cameraSelect');

let historyData = JSON.parse(localStorage.getItem('scanHistory')) || [];
let stream;

// Update nilai slider
thresholdSlider.addEventListener('input', () => {
  thresholdValue.textContent = thresholdSlider.value;
});

// Mulai kamera berdasarkan pilihan
async function startCamera(facingMode) {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facingMode }
    });
    video.srcObject = stream;
  } catch (err) {
    console.error('Gagal mengakses kamera:', err);
  }
}

// Event ubah kamera
cameraSelect.addEventListener('change', () => {
  startCamera(cameraSelect.value);
});

// Fungsi untuk scan warna rata-rata dari video
function scanColor() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < imageData.data.length; i += 4) {
    r += imageData.data[i];
    g += imageData.data[i + 1];
    b += imageData.data[i + 2];
  }
  let pixelCount = imageData.data.length / 4;
  r = Math.round(r / pixelCount);
  g = Math.round(g / pixelCount);
  b = Math.round(b / pixelCount);
  return { r, g, b };
}

// Logika sederhana kualitas & harga berdasarkan warna (contoh dummy)
function evaluateQuality(rgb) {
  let { r, g, b } = rgb;
  let quality = 'Sangat Layak';
  let price = 'Rp 20.000';
  if (r > 120 && g < 80) {
    quality = 'Masih Layak';
    price = 'Rp 15.000';
  }
  if (g > 100) {
    quality = 'Tidak Layak';
    price = 'Rp 10.000';
  }
  return { quality, price };
}

// Tombol scan
document.getElementById('scanBtn').addEventListener('click', () => {
  const rgb = scanColor();
  const { quality, price } = evaluateQuality(rgb);
  const time = new Date().toLocaleString();
  resultDiv.innerHTML = `RGB: (${rgb.r}, ${rgb.g}, ${rgb.b}) <br> Kualitas: ${quality} <br> Harga: ${price}`;

  // Simpan ke riwayat
  historyData.push({ time, rgb, quality, price });
  localStorage.setItem('scanHistory', JSON.stringify(historyData));
  renderHistory();
});

// Render tabel riwayat
function renderHistory() {
  historyTable.innerHTML = '';
  historyData.forEach(item => {
    const row = `<tr>
      <td>${item.time}</td>
      <td>(${item.rgb.r}, ${item.rgb.g}, ${item.rgb.b})</td>
      <td>${item.quality}</td>
      <td>${item.price}</td>
    </tr>`;
    historyTable.innerHTML += row;
  });
}

// Export ke CSV
document.getElementById('exportBtn').addEventListener('click', () => {
  let csvContent = "data:text/csv;charset=utf-8,Waktu,RGB,Kualitas,Harga\n";
  historyData.forEach(item => {
    csvContent += `${item.time},"(${item.rgb.r},${item.rgb.g},${item.rgb.b})",${item.quality},${item.price}\n`;
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "scan_history.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Jalankan awal kamera belakang
startCamera('environment');
renderHistory();
