const API_BASE_URL = "https://veteran-antibody-strep.ngrok-free.dev/api";const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'login.html';
}

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});

async function renderDynamicDashboard() {
    // 1. جلب بيانات وإعدادات التصميم والسمات (Theme) المخصصة للعميل
    const layoutRes = await fetch(`${API_BASE_URL}/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if(!layoutRes.ok) window.location.href = 'login.html';
    const layoutData = await layoutRes.json();
    
    document.title = layoutData.dashboard_name;
    document.getElementById('db-title').innerText = layoutData.dashboard_name;
    document.body.className = `theme-${layoutData.theme}`;

    // جلب بيانات الحساب الشخصي لعرض الاسم
    const profileRes = await fetch(`${API_BASE_URL}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const profileData = await profileRes.json();
    document.getElementById('user-display-name').innerText = `${profileData.first_name} ${profileData.last_name}`;

    // 2. جلب التحليلات والمؤشرات الرياضية التي تم حسابها بالباك إند بدون شروط ثابتة
    const analyticsRes = await fetch(`${API_BASE_URL}/dashboard/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const analyticsData = await analyticsRes.json();
    const gridContainer = document.getElementById('dashboard-main-grid');
    gridContainer.innerHTML = ''; // تفريغ الوعاء قبل الحقن الديناميكي

    // 3. بناء وحقن بطاقات العرض والرسوم البيانية حسب إعدادات قاعدة البيانات الخاصة بالعميل الحالي
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

        // إذا كان المؤشر رسم بياني خطي أو أعمدة نقوم ببنائه وتمرير البيانات المستخرجة ديناميكياً
        if (metric.chart_type !== 'card') {
            const ctx = document.getElementById(`chart-canvas-${index}`).getContext('2d');
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
    });
}

// تنفيذ المحرك تلقائياً فور تحميل الصفحة لتهيئة لوحة التحكم المخصصة للمستخدم الحالي
renderDynamicDashboard();
