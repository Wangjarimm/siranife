document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const res = await fetch('https://sirani.vercel.app/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (res.ok) {
    Swal.fire({
      icon: 'success',
      title: 'Berhasil Login',
      text: 'Selamat datang kembali!',
      confirmButtonColor: '#0c4e91',
      timer: 1500,
      showConfirmButton: false
    });

    setTimeout(() => {
      localStorage.setItem('sirani', data.token);

      // Ambil role dari response root
      const role = data.role?.toLowerCase();

      if (role === 'admin') {
        window.location.href = '/dashboard.html';
      } else if (role === 'operator') {
        window.location.href = '/operator.html';
      } else if (role === 'pengawas') {
        window.location.href = '/pengawas.html';
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Role tidak dikenali',
          text: 'Role Anda tidak memiliki akses halaman.',
          confirmButtonColor: '#d33'
        });
      }
    }, 1600);

  } else {
    Swal.fire({
      icon: 'error',
      title: 'Login Gagal',
      text: data.error || 'Username atau password salah',
      confirmButtonColor: '#d33'
    });
  }
});
