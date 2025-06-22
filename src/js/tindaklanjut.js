const token = localStorage.getItem("sirani");

document.addEventListener("DOMContentLoaded", async () => {
  if (!token) {
    Swal.fire({
      title: "Akses Ditolak",
      text: "Silakan login terlebih dahulu.",
      icon: "warning",
      confirmButtonColor: "#2e7d32",
    }).then(() => (window.location.href = "../../index.html"));
    return;
  }

  try {
    const res = await fetch("https://sirani.vercel.app/api/reports", {
      headers: {
        "Content-Type": "application/json",
        sirani: "Bearer " + token,
      },
    });

    const data = await res.json();
    const tbody = document.querySelector("#followupTable tbody");
    tbody.innerHTML = "";

    data.forEach((report) => {
      const reportId = report.id || report._id?.$oid;
      if (!reportId) {
        console.warn("Format ID tidak dikenali:", report);
        return;
      }

      // Warna badge status
      let badgeClass = "secondary";
      if (report.status === "belum ditindaklanjuti") {
        badgeClass = "danger";
      } else if (report.status === "sedang diproses") {
        badgeClass = "warning text-dark";
      } else if (report.status === "selesai") {
        badgeClass = "success";
      }

      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${report.message}</td>
          <td>${report.location}</td>
          <td>${report.emotion}</td>
          <td><span class="badge bg-${badgeClass}">${report.status}</span></td>
          <td><button class="btn btn-sm btn-primary" onclick='openFollowUp("${reportId}")'>Tindak Lanjuti</button></td>
        `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error(err);
    Swal.fire("Gagal", "Gagal memuat laporan.", "error");
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

async function openFollowUp(id) {
  console.log("openFollowUp() dipanggil dengan ID:", id);

  const { value: formValues } = await Swal.fire({
    title: "Tindak Lanjuti Laporan",
    html:
      '<textarea id="note" class="swal2-textarea" placeholder="Catatan tindak lanjut"></textarea>' +
      '<select id="status" class="swal2-select">' +
      '<option value="belum ditindaklanjuti">Belum Ditindaklanjuti</option>' +
      '<option value="sedang diproses">Sedang Diproses</option>' +
      '<option value="selesai">Selesai</option>' +
      "</select>",
    focusConfirm: false,
    confirmButtonText: "Simpan",
    preConfirm: () => {
      return {
        note: document.getElementById("note").value,
        status: document.getElementById("status").value,
      };
    },
  });

  if (!formValues) return;

  const payload = {
    note: formValues.note,
    status: formValues.status,
  };

  try {
    const res = await fetch(
      `https://sirani.vercel.app/api/reports/${id}/followup`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          sirani: "Bearer " + token,
        },
        body: JSON.stringify(payload),
      }
    );

    const contentType = res.headers.get("content-type") || "";
    let result = {};

    if (contentType.includes("application/json")) {
      result = await res.json();
    } else {
      const text = await res.text();
      console.warn("Non-JSON response:", text);
      throw new Error("Respons bukan JSON");
    }

    if (res.ok) {
      Swal.fire("Berhasil", "Tindak lanjut berhasil disimpan.", "success").then(
        () => window.location.reload()
      );
    } else {
      Swal.fire(
        "Gagal",
        result.error || "Terjadi kesalahan saat menyimpan.",
        "error"
      );
    }
  } catch (err) {
    console.error("Error saat menyimpan tindak lanjut:", err);
    Swal.fire(
      "Gagal",
      err.message || "Gagal menyimpan tindak lanjut.",
      "error"
    );
  }
}
