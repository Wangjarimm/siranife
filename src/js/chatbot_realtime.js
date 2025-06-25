const chatArea = document.getElementById('chatArea');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const proceedBtn = document.getElementById('proceedBtn');
const sosBtn = document.getElementById('sosBtn');
const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const overlayCtx = overlay.getContext('2d');

let chatHistory = [];
let lastCategory = 'lainnya';
let lastEmotion = 'netral';
let lastLocation = 'Tidak diketahui';
let snapshotBase64 = '';
let dialogEnded = false;
let hasSubmitted = false;
let stream = null;
const sessionId = crypto.randomUUID();

async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri('../../models');
  await faceapi.nets.faceExpressionNet.loadFromUri('../../models');
  await faceapi.nets.faceLandmark68TinyNet.loadFromUri('../../models');
  console.log('✅ Semua model face-api berhasil dimuat');
}

async function startVideo() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.addEventListener('play', drawLandmarksLoop);
  } catch (err) {
    console.error('❌ Tidak dapat mengakses kamera:', err);
    appendMessage('bot', '❌ Kamera tidak dapat diakses. Beberapa fitur mungkin tidak tersedia.');
  }
}

function drawLandmarksLoop() {
  const draw = async () => {
    if (!video.paused && !video.ended && stream) {
      const dims = { width: video.videoWidth, height: video.videoHeight };
      overlay.width = dims.width;
      overlay.height = dims.height;
      const results = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
        .withFaceLandmarks(true);
      overlayCtx.clearRect(0, 0, dims.width, dims.height);
      const resizedResults = faceapi.resizeResults(results, dims);
      faceapi.draw.drawFaceLandmarks(overlay, resizedResults);
    }
    requestAnimationFrame(draw);
  };
  draw();
}

function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.className = sender === 'user' ? 'chat-bubble user' : 'chat-bubble bot';
  msg.innerHTML = text.replace(/\n/g, '<br>');
  chatArea.appendChild(msg);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function captureSnapshot(video) {
  const targetWidth = 160;
  const targetHeight = 120;
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
  return canvas.toDataURL('image/jpeg', 0.6); // Gunakan JPEG + kompresi
}


async function detectFaceEmotion(video) {
  const detections = await faceapi.detectAllFaces(
    video,
    new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
  ).withFaceExpressions();
  if (!detections || detections.length === 0) return 'netral';
  const sorted = Object.entries(detections[0].expressions).sort((a, b) => b[1] - a[1]);
  return sorted[0][1] < 0.4 ? 'netral' : sorted[0][0];
}

async function getLocation() {
  try {
    const pos = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject)
    );
    const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
    const geoData = await geo.json();
    return geoData.address.city || geoData.address.town || geoData.address.village || 'Tidak diketahui';
  } catch {
    return 'Tidak diketahui';
  }
}

function getCategory(message) {
  const msg = message.toLowerCase();
  if (/dipukul|luka|dianiaya/.test(msg)) return 'fisik';
  if (/dimaki|dibentak|dihina/.test(msg)) return 'verbal';
  if (/sendiri|bunuh|depresi/.test(msg)) return 'psikologis';
  return 'lainnya';
}

function getUrgencyColor(level) {
  return level === 'tinggi' ? 'red' : level === 'sedang' ? 'orange' : 'green';
}

function getFormattedTimestamp() {
  const now = new Date();
  return now.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
}

async function handleUserMessage(message) {
  Swal.fire({
    title: 'Sedang diproses...',
    text: 'Menganalisis pesan dan ekspresi wajah',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  appendMessage('user', message);
  chatHistory.push({ sender: 'user', message, timestamp: new Date().toISOString() });

  if (chatHistory.length === 1 && stream) {
    await new Promise((resolve) => {
      if (video.readyState >= 2) resolve();
      else video.onloadeddata = () => setTimeout(resolve, 1500);
    });
    lastEmotion = await detectFaceEmotion(video);
    lastLocation = await getLocation();
    snapshotBase64 = captureSnapshot(video);
  }

  lastCategory = getCategory(message);

  try {
    const res = await fetch('https://sirani.vercel.app/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        faceEmotion: lastEmotion,
        location: lastLocation,
        category: lastCategory
      })
    });

    const result = await res.json();
    Swal.close();

    appendMessage('bot', `${result.response}<br><span class="urgency">Urgensi: <b style="color:${getUrgencyColor(result.urgency)}">${result.urgency}</b></span>`);
    chatHistory.push({ sender: 'bot', message: result.response, urgency: result.urgency, timestamp: new Date().toISOString() });

    if (/^(selesai|cukup|akhiri|laporan selesai)$/i.test(message.trim()) || result.urgency === 'tinggi') {
      dialogEnded = true;
      proceedBtn.style.display = 'block';
      appendMessage('bot', '<b>Apakah kamu ingin meneruskan laporan ini ke pihak terkait?</b>');
    } else {
      setTimeout(() => {
        appendMessage('bot', 'Apakah ada hal lain yang ingin kamu ceritakan? Jika sudah selesai, ketik "selesai".');
      }, 800);
    }
  } catch (err) {
    Swal.fire('Gagal', 'Gagal terhubung ke server.', 'error');
  }
}

sendBtn.addEventListener('click', () => {
  if (dialogEnded) return;
  const msg = chatInput.value.trim();
  if (!msg) return;
  chatInput.value = '';
  handleUserMessage(msg);
});

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendBtn.click();
  }
});

proceedBtn.addEventListener('click', async () => {
  if (hasSubmitted) return;
  hasSubmitted = true;
  proceedBtn.disabled = true;

  Swal.fire({
    title: 'Mengirim Laporan...',
    text: 'Mohon tunggu sebentar',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const res = await fetch('https://sirani.vercel.app/proceed-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        chatHistory,
        faceEmotion: lastEmotion,
        location: lastLocation,
        category: lastCategory,
        snapshotBase64
      })
    });

    const result = await res.json();
    Swal.close();
    const timestamp = getFormattedTimestamp();
    appendMessage('bot', `✅ Laporan kamu berhasil diteruskan.<br><small>Dikirim pada: ${timestamp}</small>`);
    proceedBtn.style.display = 'none';
  } catch (err) {
    Swal.fire('Error', 'Terjadi kesalahan saat mengirim laporan.', 'error');
    proceedBtn.disabled = false;
    hasSubmitted = false;
  }
});

sosBtn.addEventListener('click', async () => {
  if (hasSubmitted) return;
  hasSubmitted = true;

  Swal.fire({
    title: 'Mengirim SOS...',
    text: 'Sedang mengambil data wajah dan lokasi',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    if (stream && video.readyState >= 2) {
      await new Promise((resolve) => {
        if (video.readyState >= 2) resolve();
        else video.onloadeddata = () => setTimeout(resolve, 1500);
      });
      lastEmotion = await detectFaceEmotion(video);
      lastLocation = await getLocation();
      snapshotBase64 = captureSnapshot(video);
    }

    const res = await fetch('https://sirani.vercel.app/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        faceEmotion: lastEmotion,
        location: lastLocation,
        snapshotBase64,
        chatHistory
      })
    });

    const result = await res.json();
    Swal.close();

    if (res.ok) {
      appendMessage('bot', '🚨 Laporan SOS berhasil dikirim. Tim kami segera merespons laporanmu.');
    } else {
      appendMessage('bot', `❌ Gagal mengirim laporan SOS: ${result.error}`);
      hasSubmitted = false;
    }
  } catch (err) {
    Swal.fire('Error', 'Gagal mengirim laporan SOS.', 'error');
    hasSubmitted = false;
  }
});

window.addEventListener('DOMContentLoaded', async () => {
  await loadModels();
  await startVideo();
  appendMessage('bot', 'Halo, silakan ceritakan apa yang kamu alami.');
});
