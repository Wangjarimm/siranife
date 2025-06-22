const form = document.getElementById('reportForm');
    const responseBox = document.getElementById('responseBox');
    const video = document.getElementById('video');
    const sosBtn = document.getElementById('sosBtn');

    async function loadModels() {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('../../models');
        await faceapi.nets.faceExpressionNet.loadFromUri('../../models');
        console.log("✅ Model berhasil dimuat");
      } catch (error) {
        console.error("❌ Gagal memuat model:", error);
      }
    }

    async function detectFaceEmotion(video) {
      try {
        const detections = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
        ).withFaceExpressions();

        console.log("Detections:", detections);

        if (!detections || detections.length === 0) {
          console.warn("❌ Tidak ada wajah terdeteksi.");
          return 'netral';
        }

        const expressions = detections[0].expressions;
        const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
        const top = sorted[0];
        console.log("Top expression:", top);
        return top[1] < 0.4 ? 'netral' : top[0];
      } catch (err) {
        console.error("❌ Gagal mendeteksi wajah:", err);
        return 'netral';
      }
    }

    sosBtn.addEventListener('click', async () => {
      Swal.fire({
        title: 'Mengirim sinyal darurat...',
        text: 'Mohon tunggu sebentar.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;

        await new Promise((resolve) => {
          video.onloadeddata = () => setTimeout(resolve, 1500);
        });

        const faceEmotion = await detectFaceEmotion(video);
        stream.getTracks().forEach(track => track.stop());

        let location = 'Tidak diketahui';
        try {
          const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
          const geoData = await geo.json();
          location = geoData.address.city || geoData.address.town || geoData.address.village || 'Tidak diketahui';
        } catch (err) {
          console.warn("Gagal ambil lokasi", err);
        }

        const res = await fetch("https://sirani.vercel.app/sos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ faceEmotion, location })
        });

        const result = await res.json();

        if (res.ok) {
          Swal.fire({
            icon: 'success',
            title: 'SOS terkirim',
            text: 'Tim akan segera menindaklanjuti.'
          });
        } else {
          throw new Error(result.error);
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal mengirim SOS',
          text: err.message
        });
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = document.getElementById('message').value;

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;

      await new Promise((resolve) => {
        video.onloadeddata = () => setTimeout(resolve, 1500);
      });

      const faceEmotion = await detectFaceEmotion(video);
      stream.getTracks().forEach(track => track.stop());

      let category = 'lainnya';
      if (/dipukul|luka|dianiaya/.test(message.toLowerCase())) category = 'fisik';
      else if (/dimaki|dibentak|dihina/.test(message.toLowerCase())) category = 'verbal';
      else if (/sendiri|bunuh|depresi/.test(message.toLowerCase())) category = 'psikologis';

      let location = 'Tidak diketahui';
      try {
        const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        const geoData = await geo.json();
        location = geoData.address.city || geoData.address.town || geoData.address.village || 'Tidak diketahui';
      } catch (err) {
        console.warn("Gagal ambil lokasi", err);
      }

      const res = await fetch("https://sirani.vercel.app/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, faceEmotion, location, category })
      });

      const result = await res.json();

      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Laporan terkirim', text: 'Kami telah menerima laporanmu dengan aman.' });
        responseBox.style.display = 'block';
        responseBox.innerHTML = `
          <strong>Respon Sistem:</strong><br><br>
          ${result.response.replace(/\n/g, '<br>')}<br><br>
          <strong>Tingkat Urgensi:</strong> <span style="color:${getUrgencyColor(result.urgency)}">${result.urgency}</span>
        `;
        form.reset();
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal', text: result.error || 'Terjadi kesalahan saat mengirim laporan.' });
      }
    });

    function getUrgencyColor(level) {
      return level === 'tinggi' ? 'red' : level === 'sedang' ? 'orange' : 'green';
    }

    window.addEventListener('DOMContentLoaded', () => {
      loadModels();
    });