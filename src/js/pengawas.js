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
    const locationCount = {};

    reports.forEach((report) => {
      const loc = (report.location || "Tidak Diketahui").trim();
      locationCount[loc] = (locationCount[loc] || 0) + 1;
    });

    // Sort dan tampilkan list lokasi
    const sortedLocations = Object.entries(locationCount).sort(
      (a, b) => b[1] - a[1]
    );
    const maxCount = sortedLocations[0]?.[1] || 0;

    const locationList = document.getElementById("locationStats");
    locationList.innerHTML = "";

    sortedLocations.forEach(([location, count]) => {
      const li = document.createElement("li");
      li.innerHTML = `${location}: <strong class="${
        count === maxCount ? "highlight" : ""
      }">${count} laporan</strong>`;
      locationList.appendChild(li);
    });

    // Setup chart
    const ctx = document.getElementById("locationChart").getContext("2d");
    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: sortedLocations.map((l) => l[0]),
        datasets: [
          {
            label: "Jumlah Laporan per Wilayah",
            data: sortedLocations.map((l) => l[1]),
            backgroundColor: sortedLocations.map((l) =>
              l[1] === maxCount
                ? "rgba(244, 67, 54, 0.8)"
                : "rgba(97, 97, 97, 0.7)"
            ),
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y} laporan`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Jumlah Laporan",
            },
          },
          x: {
            title: {
              display: true,
              text: "Wilayah",
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Gagal memuat data lokasi:", error);
    document.getElementById("locationStats").innerHTML =
      '<li class="text-danger">Gagal memuat data.</li>';
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
