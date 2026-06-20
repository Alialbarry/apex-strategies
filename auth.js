// استبدل هذا بالرابط الثابت الخاص بجهازك أو سيرفر الاستضافة
const API_BASE_URL = "http://127.0.0.1:8000/api";

document.getElementById('show-signup').addEventListener('click', () => {
    document.getElementById('signin-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
    document.getElementById('form-title').innerText = 'إنشاء حساب مستخدم جديد';
});

document.getElementById('show-signin').addEventListener('click', () => {
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('signin-form').style.display = 'block';
    document.getElementById('form-title').innerText = 'تسجيل الدخول إلى المنصة';
});

// التعامل مع الدخول
document.getElementById('signin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const res = await fetch(`${API_BASE_URL}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    if(res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        window.location.href = 'dashboard.html';
    } else {
        alert('فشل تسجيل الدخول، يرجى التحقق من البيانات المطلوبة.');
    }
});

// التعامل مع التسجيل الموحد لقطاع معين
document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const first_name = document.getElementById('reg-firstname').value;
    const last_name = document.getElementById('reg-lastname').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const account_type = document.getElementById('reg-sector').value;

    const res = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name, last_name, email, password, account_type })
    });

    if(res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        window.location.href = 'dashboard.html';
    } else {
        alert('حدث خطأ أثناء إعداد الحساب.');
    }
});
