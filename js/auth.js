// رابط الـ API العالمي المشفر والخاص بنفق خادم ngrok
const API_BASE_URL = "https://veteran-antibody-strep.ngrok-free.dev/api";

// انتظار المتصفح لإنهاء تحميل عناصر شجرة الـ DOM بالكامل
document.addEventListener("DOMContentLoaded", () => {
    
    const showSignupBtn = document.getElementById('show-signup');
    const showSigninBtn = document.getElementById('show-signin');
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const formTitle = document.getElementById('form-title');

    // تنظيف التوكنات القديمة لضمان عدم تداخل جلسات المستخدمين
    localStorage.removeItem('access_token');

    // الانتقال السلس إلى واجهة "إنشاء حساب جديد"
    if (showSignupBtn) {
        showSignupBtn.addEventListener('click', (e) => {
            e.preventDefault(); // منع الصفحة من إعادة التحميل التلقائي
            if (signinForm) signinForm.style.display = 'none';
            if (signupForm) signupForm.style.display = 'flex'; // استخدام flex للحفاظ على مظهر الـ CSS المحدث
            if (formTitle) formTitle.innerText = 'إنشاء حساب مستخدم جديد';
        });
    }

    // العودة الآمنة إلى واجهة "تسجيل الدخول"
    if (showSigninBtn) {
        showSigninBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (signupForm) signupForm.style.display = 'none';
            if (signinForm) signinForm.style.display = 'flex'; // استخدام flex للحفاظ على مظهر الـ CSS المحدث
            if (formTitle) formTitle.innerText = 'تسجيل الدخول إلى المنصة';
        });
    }

    // التعامل الذكي مع استمارة الدخول الموحد (Sign In)
    if (signinForm) {
        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const res = await fetch(`${API_BASE_URL}/signin`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.access_token) {
                        // توحيد اسم المفتاح إلى access_token تماشياً مع معايير الأمان وقواعد البيانات
                        localStorage.setItem('access_token', data.access_token);
                        window.location.href = 'dashboard.html';
                    } else {
                        alert('تم تسجيل الدخول، ولكن الخادم لم يقم بإرجاع التوكن الموثق.');
                    }
                } else {
                    const errorData = await res.json().catch(() => ({}));
                    const errorDetail = errorData.detail || 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
                    alert(`فشل تسجيل الدخول: ${errorDetail}`);
                }
            } catch (error) {
                console.error("Error during signin:", error);
                alert('عذراً، تعذر الاتصال بالسيرفر. تأكد من تشغيل خادم FastAPI ونفق ngrok بشكل سليم.');
            }
        });
    }

    // التعامل التلقائي مع استمارة التسجيل الحركي لقطاع معين (Sign Up)
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const first_name = document.getElementById('reg-firstname').value;
            const last_name = document.getElementById('reg-lastname').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const account_type = document.getElementById('reg-sector').value;

            try {
                const res = await fetch(`${API_BASE_URL}/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ first_name, last_name, email, password, account_type })
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.access_token) {
                        // توحيد اسم المفتاح إلى access_token
                        localStorage.setItem('access_token', data.access_token);
                        alert('تم تفعيل حسابك وبناء اللوحة المخصصة لقطاعك بنجاح!');
                        window.location.href = 'dashboard.html';
                    } else {
                        window.location.href = 'login.html';
                    }
                } else {
                    const errorData = await res.json().catch(() => ({}));
                    const errorDetail = errorData.detail || 'يرجى مراجعة البيانات المدخلة وطول كلمة المرور.';
                    alert(`حدث خطأ أثناء إعداد الحساب: ${errorDetail}`);
                }
            } catch (error) {
                console.error("Error during signup:", error);
                alert('عذراً، تعذر الاتصال بالسيرفر لإتمام عملية تسجيل الحساب الموحد.');
            }
        });
    }
});
