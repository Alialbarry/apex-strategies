// رابط الـ API العالمي الخاص بالنفق المشفر لـ ngrok
const API_BASE_URL = "https://veteran-antibody-strep.ngrok-free.dev/api";

// انتهاء المتصفح من تحميل العناصر قبل تفعيل الأزرار
document.addEventListener("DOMContentLoaded", () => {
    
    const showSignupBtn = document.getElementById('show-signup');
    const showSigninBtn = document.getElementById('show-signin');
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const formTitle = document.getElementById('form-title');

    // الانتقال إلى شاشة "إنشاء حساب جديد"
    if (showSignupBtn) {
        showSignupBtn.addEventListener('click', (e) => {
            e.preventDefault(); // منع الصفحة من إعادة التحميل الافتراضية
            signinForm.style.display = 'none';
            signupForm.style.display = 'block';
            formTitle.innerText = 'إنشاء حساب مستخدم جديد';
        });
    }

    // العودة إلى شاشة "تسجيل الدخول"
    if (showSigninBtn) {
        showSigninBtn.addEventListener('click', (e) => {
            e.preventDefault(); // منع الصفحة من إعادة التحميل الافتراضية
            signupForm.style.display = 'none';
            signinForm.style.display = 'block';
            formTitle.innerText = 'تسجيل الدخول إلى المنصة';
        });
    }

    // التعامل مع استمارة الدخول (Sign In)
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
                    localStorage.setItem('token', data.access_token);
                    window.location.href = 'dashboard.html';
                } else {
                    alert('فشل تسجيل الدخول، يرجى التحقق من البيانات المطلوبة.');
                }
            } catch (error) {
                console.error("Error during signin:", error);
                alert('عذراً، تعذر الاتصال بالسيرفر. تأكد من تشغيل Uvicorn و ngrok.');
            }
        });
    }

    // التعامل مع استمارة التسجيل الموحد لقطاع معين (Sign Up)
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
                    localStorage.setItem('token', data.access_token);
                    window.location.href = 'dashboard.html';
                } else {
                    alert('حدث خطأ أثناء إعداد الحساب. يرجى مراجعة البيانات.');
                }
            } catch (error) {
                console.error("Error during signup:", error);
                alert('عذراً، تعذر الاتصال بالسيرفر لتسجيل الحساب.');
            }
        });
    }
});
