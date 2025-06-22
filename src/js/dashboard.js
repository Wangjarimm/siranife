document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("sirani");
  if (!token) {
    Swal.fire({
      title: "Akses Ditolak",
      text: "Silakan login terlebih dahulu.",
      icon: "warning",
      confirmButtonColor: "#0c4e91",
      confirmButtonText: "OK",
    }).then(() => {
      window.location.href = "../../index.html";
    });
    return;
  }

  const headers = {
    "Content-Type": "application/json",
    sirani: "Bearer " + token,
  };

  try {
    const reportRes = await fetch("https://sirani.vercel.app/api/reports", {
      headers,
    });
    const reports = await reportRes.json();

    document.getElementById("totalReports").textContent = reports.length;
    const highPriority = reports.filter(
      (r) => r.urgencyLevel?.toLowerCase() === "tinggi"
    );
    document.getElementById("highPriorityReports").textContent =
      highPriority.length;

    const tableBody = document.querySelector("#reportTable tbody");
    tableBody.innerHTML = "";
    const sortedReports = reports
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    sortedReports.forEach((report) => {
      const urgency = report.urgencyLevel?.toLowerCase() || "rendah";
      let badgeClass = "bg-success";
      if (urgency === "tinggi") {
        badgeClass = "bg-danger";
      } else if (urgency === "sedang") {
        badgeClass = "bg-warning text-dark";
      }

      const row = document.createElement("tr");
      row.innerHTML = `
            <td>${new Date(report.createdAt).toLocaleString("id-ID")}</td>
            <td>${report.location || "-"}</td>
            <td>
              <span class="badge ${badgeClass}">
                ${urgency.charAt(0).toUpperCase() + urgency.slice(1)}
              </span>
            </td>
          `;
      tableBody.appendChild(row);
    });

    const userRes = await fetch("https://sirani.vercel.app/admin/users", {
      headers,
    });
    const users = await userRes.json();
    const activeUsers = users.filter((u) => u.active === true);
    document.getElementById("activeOperators").textContent = activeUsers.length;
  } catch (error) {
    console.error("Gagal memuat data dashboard:", error);
    document.getElementById("totalReports").textContent = "Gagal";
    document.getElementById("highPriorityReports").textContent = "Gagal";
    document.getElementById("activeOperators").textContent = "Gagal";
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
