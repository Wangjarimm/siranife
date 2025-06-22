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

  const perPage = 50;
  let currentPage = 1;
  let logs = [];

  function renderPagination(total, current) {
    const pages = Math.ceil(total / perPage);
    const container = document.getElementById("pagination");
    container.innerHTML = "";

    for (let i = 1; i <= pages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.className = `btn btn-sm ${
        i === current ? "btn-primary" : "btn-outline-primary"
      }`;
      btn.onclick = () => {
        currentPage = i;
        renderTablePage(logs, currentPage);
      };
      container.appendChild(btn);
    }
  }

  function renderTablePage(data, page) {
    const tbody = document.querySelector("#logTable tbody");
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const sliced = data.slice(start, end);

    tbody.innerHTML = "";

    sliced.forEach((log) => {
      const method = log.method.toUpperCase();
      let badgeClass = "bg-secondary";

      if (method === "GET") badgeClass = "bg-success text-white";
      else if (method === "POST") badgeClass = "bg-warning text-dark";
      else if (method === "PUT") badgeClass = "bg-purple text-white";
      else if (method === "DELETE") badgeClass = "bg-danger text-white";

      const row = document.createElement("tr");
      row.innerHTML = `
            <td>${log.username}</td>
            <td>${log.route}</td>
            <td><span class="badge ${badgeClass}">${method}</span></td>
            <td>${new Date(log.timestamp).toLocaleString("id-ID")}</td>
          `;
      tbody.appendChild(row);
    });

    renderPagination(data.length, page);
  }

  try {
    const res = await fetch("https://sirani.vercel.app/admin/logs", { headers });
    if (!res.ok) throw new Error("Gagal mengambil log audit");

    logs = await res.json();
    renderTablePage(logs, currentPage);

    const style = document.createElement("style");
    style.innerHTML = `.bg-purple { background-color: #6f42c1 !important; }`;
    document.head.appendChild(style);
  } catch (err) {
    console.error(err);
    Swal.fire("Gagal", "Gagal memuat log audit. Silakan coba lagi.", "error");
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
