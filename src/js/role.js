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
    const res = await fetch("https://sirani.vercel.app/admin/users", { headers });
    const users = await res.json();

    const tbody = document.querySelector("#userTable tbody");
    tbody.innerHTML = "";

    users.forEach((user) => {
      const userId = user.id;

      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${user.username}</td>
          <td>
            <select class="form-select form-select-sm role-select" data-id="${userId}">
              <option value="pengawas" ${
                user.role === "pengawas" ? "selected" : ""
              }>Pengawas</option>
              <option value="operator" ${
                user.role === "operator" ? "selected" : ""
              }>Operator</option>
              <option value="admin" ${
                user.role === "admin" ? "selected" : ""
              }>Admin</option>
            </select>
          </td>
          <td>
            <span class="badge ${user.active ? "bg-success" : "bg-secondary"}">
              ${user.active ? "Aktif" : "Nonaktif"}
            </span>
          </td>
          <td>
            <button class="btn btn-${
              user.active ? "danger" : "success"
            } btn-sm toggle-status" data-id="${userId}" data-status="${
        user.active
      }">
              ${user.active ? "Nonaktifkan" : "Aktifkan"}
            </button>
          </td>
        `;
      tbody.appendChild(row);
    });

    document.querySelectorAll(".role-select").forEach((select) => {
      select.addEventListener("change", async (e) => {
        const id = e.target.getAttribute("data-id");
        const newRole = e.target.value;

        const confirm = await Swal.fire({
          title: "Konfirmasi",
          text: `Ubah role pengguna ini menjadi "${newRole}"?`,
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Ya, ubah",
          cancelButtonText: "Batal",
        });

        if (confirm.isConfirmed) {
          const res = await fetch(
            `https://sirani.vercel.app/admin/user-role/${id}`,
            {
              method: "PUT",
              headers,
              body: JSON.stringify({ role: newRole }),
            }
          );
          const result = await res.json();
          if (res.ok) {
            Swal.fire("Berhasil", "Role berhasil diperbarui.", "success").then(
              () => location.reload()
            );
          } else {
            Swal.fire(
              "Gagal",
              result.error || "Gagal memperbarui role.",
              "error"
            );
          }
        } else {
          e.target.value = users.find((u) => u.id === id)?.role || "user";
        }
      });
    });

    document.querySelectorAll(".toggle-status").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const id = e.target.getAttribute("data-id");
        const currentStatus = e.target.getAttribute("data-status") === "true";
        const newStatus = !currentStatus;

        const confirm = await Swal.fire({
          title: "Konfirmasi",
          text: `Yakin ingin ${
            newStatus ? "mengaktifkan" : "menonaktifkan"
          } pengguna ini?`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Ya, lanjutkan",
          cancelButtonText: "Batal",
        });

        if (confirm.isConfirmed) {
          const res = await fetch(
            `https://sirani.vercel.app/admin/user-id/${id}/status`,
            {
              method: "PUT",
              headers,
              body: JSON.stringify({ active: newStatus }),
            }
          );

          const result = await res.json();
          if (res.ok) {
            Swal.fire(
              "Berhasil",
              "Status berhasil diperbarui.",
              "success"
            ).then(() => location.reload());
          } else {
            Swal.fire(
              "Gagal",
              result.error || "Gagal mengubah status.",
              "error"
            );
          }
        }
      });
    });
  } catch (err) {
    console.error("Gagal memuat data:", err);
    Swal.fire("Error", "Gagal memuat data pengguna.", "error");
  }

  // Logout
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
