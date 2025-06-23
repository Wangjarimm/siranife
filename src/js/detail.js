document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("sirani");
  if (!token) {
    Swal.fire({
      title: "Akses Ditolak",
      text: "Silakan login terlebih dahulu.",
      icon: "warning",
      confirmButtonColor: "#2e7d32",
      confirmButtonText: "OK",
    }).then(() => {
      window.location.href = "../../index.html";
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

    if (!res.ok) throw new Error("Gagal mengambil laporan");

    const reports = await res.json();
    const tbody = document.querySelector("#reportTable tbody");
    tbody.innerHTML = "";

    if (reports.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="text-center">Belum ada laporan masuk.</td></tr>';
    } else {
      reports.forEach((report) => {
        const row = document.createElement("tr");

        // Menampilkan snapshot sebagai gambar jika ada
        const snapshotHtml = report.snapshot
          ? `<img src="${report.snapshot}" alt="snapshot" style="max-width: 120px; border-radius: 8px;" />`
          : "-";

        row.innerHTML = `
              <td>${report.message || "-"}</td>
              <td>${report.location || "-"}</td>
              <td>${report.emotion || "-"}</td>
              <td>${report.category || "-"}</td>
              <td>${report.urgencyLevel || "-"}</td>
              <td>${new Date(report.createdAt).toLocaleString("id-ID")}</td>
              <td>${snapshotHtml}</td>

            `;
        tbody.appendChild(row);
      });
    }
  } catch (err) {
    console.error(err);
    Swal.fire("Gagal", "Tidak dapat memuat data laporan.", "error");
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
        window.location.href = "../../index.html";
      }
    });
  });
});
