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

    if (!res.ok) throw new Error("Gagal mengambil data laporan");

    const reports = await res.json();

    // Filter laporan dengan urgencyLevel === "tinggi"
    const highPriorityReports = reports.filter(
      (r) => (r.urgencyLevel || "").toLowerCase() === "tinggi"
    );

    const tbody = document.querySelector("#reportTable tbody");
    tbody.innerHTML = "";

    if (highPriorityReports.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="text-center">Tidak ada laporan prioritas tinggi.</td></tr>';
    } else {
      highPriorityReports.forEach((report) => {
        const row = document.createElement("tr");
        row.innerHTML = `
              <td>${report.message || "-"}</td>
              <td>${report.location || "-"}</td>
              <td>${report.emotion || "-"}</td>
            <td>${report.urgencyLevel || "-"}</td>
              <td>${new Date(report.createdAt).toLocaleString("id-ID")}</td>
            `;
        tbody.appendChild(row);
      });
    }
  } catch (error) {
    console.error(error);
    Swal.fire("Gagal", "Terjadi kesalahan saat mengambil laporan.", "error");
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
