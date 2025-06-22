document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("sirani");
  if (!token) {
    Swal.fire({
      title: "Akses Ditolak",
      text: "Silakan login terlebih dahulu.",
      icon: "warning",
      confirmButtonColor: "#212121",
      confirmButtonText: "OK",
    }).then(() => {
      window.location.href = "index.html";
    });
    return;
  }

  try {
    const res = await fetch("https://sirani.vercel.app/api/reports", {
      headers: {
        "Content-Type": "application/json",
        sirani: "Bearer " + token,
      },
    });
    const reports = await res.json();

    const countBy = (arr, key) => {
      return arr.reduce((acc, item) => {
        const val = (item[key] || "Tidak Diketahui").trim();
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {});
    };

    const emotionCount = countBy(reports, "emotion");
    const categoryCount = countBy(reports, "category");
    const locationCount = countBy(reports, "location");

    const monthCount = reports.reduce((acc, item) => {
      const date = new Date(item.createdAt);
      const month = date.toLocaleString("id-ID", {
        month: "short",
        year: "numeric",
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    const createBarChart = (ctxId, label, dataObj, color) => {
      const ctx = document.getElementById(ctxId).getContext("2d");
      new Chart(ctx, {
        type: "bar",
        data: {
          labels: Object.keys(dataObj),
          datasets: [
            {
              label,
              data: Object.values(dataObj),
              backgroundColor: color,
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: "Jumlah" },
            },
            x: {
              title: { display: true, text: label },
            },
          },
        },
      });
    };

    createBarChart(
      "emotionChart",
      "Emosi",
      emotionCount,
      "rgba(255, 99, 132, 0.7)"
    );
    createBarChart(
      "categoryChart",
      "Kategori Kekerasan",
      categoryCount,
      "rgba(54, 162, 235, 0.7)"
    );
    createBarChart(
      "locationChart",
      "Wilayah",
      locationCount,
      "rgba(255, 206, 86, 0.7)"
    );
    createBarChart(
      "monthlyChart",
      "Waktu Laporan (per Bulan)",
      monthCount,
      "rgba(75, 192, 192, 0.7)"
    );
  } catch (err) {
    console.error("Gagal mengambil data:", err);
    Swal.fire("Gagal", "Tidak dapat memuat data statistik.", "error");
  }

  document.getElementById("logoutBtn").addEventListener("click", function (e) {
    e.preventDefault();
    Swal.fire({
      title: "Yakin ingin logout?",
      text: "Kamu akan keluar dari sesi saat ini.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, logout",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("sirani");
        window.location.href = "index.html";
      }
    });
  });
});
