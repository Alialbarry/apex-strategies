const API_BASE_URL = "https://veteran-antibody-strep.ngrok-free.dev/api";
const token = localStorage.getItem('token');

// التحقق الفوري من وجود التوكن لمنع الزوار غير المسجلين من رؤية اللوحة
if (!token) {
    window.location.href = 'login.html';
}

// انتهاء المتصفح من قراءة وتجهيز كافة عناصر الـ HTML قبل تنفيذ أي عمليات ربط أو جلب بيانات
document.addEventListener("DOMContentLoaded", () => {

    // تفعيل زر تسجيل الخروج
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'login.html';
        });
    }

    // محرك بناء لوحة التحكم الديناميكية
    async function renderDynamicDashboard() {
        try {
            // 1. جلب بيانات وإعدادات التصميم والسمات (Theme) المخصصة للعميل والقطاع
            const layoutRes = await fetch(`${API_BASE_URL}/dashboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!layoutRes.ok) {
                window.location.href = 'login.html';
                return;
            }
            const layoutData = await layoutRes.json();
            
            document.title = layoutData.dashboard_name;
            
            const dbTitle = document.getElementById('db-title');
            if (dbTitle) dbTitle.innerText = layoutData.dashboard_name;
            
            document.body.className = `theme-${layoutData.theme}`;

            // جلب بيانات الحساب الشخصي لعرض اسم المستخدم الحالي
            const profileRes = await fetch(`${API_BASE_URL}/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (profileRes.ok) {
                const profileData = await profileRes.json();
                const userDisplayName = document.getElementById('user-display-name');
                if (userDisplayName) {
                    userDisplayName.innerText = `${profileData.first_name} ${profileData.last_name}`;
                }
            }

            // 2. جلب التحليلات والمؤشرات الرياضية الخاصة بالقطاع من الباك إند
            const analyticsRes = await fetch(`${API_BASE_URL}/dashboard/analytics`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!analyticsRes.ok) return;
            const analyticsData = await analyticsRes.json();
            
            const gridContainer = document.getElementById('dashboard-main-grid');
            if (!gridContainer) return;
            
            gridContainer.innerHTML = ''; // تفريغ الوعاء قبل الحقن الديناميكي للمؤشرات

            // 3. بناء وحقن بطاقات العرض والرسوم البيانية حسب إعدادات قاعدة البيانات الخاصة بالعميل
            analyticsData.forEach((metric, index) => {
                const card = document.createElement('div');
                card.className = 'widget-card';
                
                if (metric.chart_type === 'card') {
                    card.innerHTML = `
                        <h3>${metric.metric_name}</h3>
                        <div class="kpi-value">${metric.calculated_value}</div>
                    `;
                } else {
                    card.innerHTML = `
                        <h3>${metric.metric_name}</h3>
                        <canvas id="chart-canvas-${index}"></canvas>
                    `;
                }
                
                gridContainer.appendChild(card);

                // إذا كان المؤشر رسماً بيانياً (خطي أو أعمدة) نقوم ببنائه وتمرير البيانات المستخرجة
                if (metric.chart_type !== 'card') {
                    const canvasElement = document.getElementById(`chart-canvas-${index}`);
                    if (canvasElement) {
                        const ctx = canvasElement.getContext('2d');
                        new Chart(ctx, {
                            type: metric.chart_type === 'line' ? 'line' : 'bar',
                            data: {
                                labels: ['الربع الأول', 'الربع الثاني', 'الربع الثالث', 'الحالي'],
                                datasets: [{
                                    label: metric.metric_name,
                                    data: metric.data_points,
                                    backgroundColor: '#38bdf8',
                                    borderColor: '#3b82f6',
                                    borderWidth: 2
                                }]
                            },
                            options: { responsive: true, plugins: { legend: { display: false } } }
                        });
                    }
                }
            });
            
        } catch (error) {
            console.error("خطأ أثناء تحميل بيانات لوحة التحكم الديناميكية:", error);
        }
    }

    // تشغيل المحرك التلقائي فوراً
    renderDynamicDashboard();
});
