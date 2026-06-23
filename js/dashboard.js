document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    
    // طباعة التوكن في الكونسول للتأكد من وجوده أثناء الفحص والـ Debugging
    console.log("Current Token found:", token);
    
    if (!token) {
        console.log("No token found, redirecting to login...");
        window.location.href = 'login.html'; // تعديل المسار ليتطابق مع صفحة الدخول الموحدة
        return;
    }

    // رابط السيرفر المتصل عبر نفق ngrok المشفر
    const API_BASE_URL = 'https://veteran-antibody-strep.ngrok-free.dev/api';

    let revenueTrendChart = null;
    let leadSourceChart = null;

    // تفعيل زر تسجيل الخروج برمجياً وتنظيف الجلسة
    const logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('access_token');
            window.location.href = 'login.html';
        });
    }

    async function loadDashboardData() {
        try {
            console.log("Attempting to fetch layout from:", `${API_BASE_URL}/dashboard`);
            
            // 1. جلب إعدادات وتسمية اللوحة العامة لكل قطاع وعميل
            const configResponse = await fetch(`${API_BASE_URL}/dashboard`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (configResponse.ok) {
                const configData = await configResponse.json();
                const titleEl = document.getElementById('dashboard-title');
                if (titleEl) titleEl.innerText = configData.dashboard_name;
            } else if (configResponse.status === 401 || configResponse.status === 403) {
                console.log("Unauthorized token! Redirecting...");
                localStorage.removeItem('access_token');
                window.location.href = 'login.html';
                return;
            }

            // 2. جلب المقاييس والبيانات التحليلية الحية المخصصة من قاعدة البيانات
            const analyticsResponse = await fetch(`${API_BASE_URL}/dashboard/analytics`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!analyticsResponse.ok) throw new Error('Failed to fetch analytics data');
            const data = await analyticsResponse.json();
            console.log("Analytics Data Received:", data);

            // 3. تحديث الكروت الرقمية (KPIs) بالبحث الديناميكي لضمان دعم كافة الحسابات والقطاعات
            const kpiContainer = document.getElementById('kpi-container');
            if (kpiContainer) {
                // البحث المرن عن المؤشر بدلاً من الاعتماد اللامركزي على الـ index الثابت للمصفوفة
                const revMetric = data.find(m => m.metric_name.toLowerCase().includes('revenue') || m.metric_name.includes('كفاءة') || m.metric_name.includes('المرضى')) || {calculated_value: "0.0", metric_name: "المؤشر الرئيسي"};
                const appMetric = data.find(m => m.metric_name.toLowerCase().includes('appointment') || m.metric_name.includes('الهدر') || m.metric_name.includes('الانتظار')) || {calculated_value: "0.0", metric_name: "المؤشر الثاني"};
                const rateMetric = data.find(m => m.metric_name.toLowerCase().includes('rate') || m.metric_name.includes('دوران') || m.metric_name.includes('إيرادات')) || {calculated_value: "0.0", metric_name: "المؤشر الثالث"};

                kpiContainer.innerHTML = `
                    <div class="widget-card">
                        <h3>${revMetric.metric_name}</h3>
                        <div class="kpi-value">${revMetric.calculated_value}</div>
                    </div>
                    <div class="widget-card">
                        <h3>${appMetric.metric_name}</h3>
                        <div class="kpi-value">${appMetric.calculated_value}</div>
                    </div>
                    <div class="widget-card">
                        <h3>${rateMetric.metric_name}</h3>
                        <div class="kpi-value">${rateMetric.calculated_value}</div>
                    </div>
                `;
            }

            // 4. رسم أو تحديث منحنى الاتجاهات الخطي (Line Chart)
            const canvasLine = document.getElementById('revenueTrendChart');
            const lineMetric = data.find(m => m.chart_type === 'line');
            
            if (canvasLine && lineMetric) {
                const ctxLine = canvasLine.getContext('2d');
                if (revenueTrendChart) { revenueTrendChart.destroy(); }
                
                revenueTrendChart = new Chart(ctxLine, {
                    type: 'line',
                    data: {
                        labels: ['January', 'February', 'March', 'April'],
                        datasets: [{
                            label: lineMetric.metric_name,
                            data: lineMetric.data_points,
                            borderColor: '#E040FB',
                            backgroundColor: 'rgba(224, 64, 251, 0.1)',
                            fill: true,
                            borderWidth: 3,
                            tension: 0.3
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: true, labels: { color: '#94a3b8' } } }
                    }
                });
            }

            // 5. رسم أو تحديث توزيع الإيرادات والنسب الشريطة (Horizontal Bar Chart)
            const canvasBar = document.getElementById('leadSourceChart');
            const barMetric = data.find(m => m.chart_type === 'bar');
            
            if (canvasBar && barMetric) {
                const ctxBar = canvasBar.getContext('2d');
                if (leadSourceChart) { leadSourceChart.destroy(); }
                
                leadSourceChart = new Chart(ctxBar, {
                    type: 'bar',
                    data: {
                        labels: ['Friend Referral', 'TikTok', 'Google Maps', 'Instagram'],
                        datasets: [{
                            label: barMetric.metric_name,
                            data: barMetric.data_points,
                            backgroundColor: ['#3182CE', '#319795', '#805AD5', '#D53F8C'],
                            borderWidth: 0,
                            borderRadius: 4
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } }
                    }
                });
            }

        } catch (error) {
            console.error("Error loading dashboard content:", error);
        }
    }

    // --------------------------------------------------------
    // رفع ملف الـ Excel بأمان تام ومنع الـ Reload اللانهائي
    // --------------------------------------------------------
    const fileInput = document.getElementById('excel-file-input');
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const nameDisplay = document.getElementById('file-name-display');
            if (nameDisplay) nameDisplay.innerText = `جاري معالجة وحساب: ${file.name}`;
            
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch(`${API_BASE_URL}/dashboard/upload-excel`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const result = await response.json();
                
                if (response.ok) {
                    alert(result.message || "تمت المعالجة بنجاح");
                    await loadDashboardData(); // تحديث حركي فوري للرسوم والمقاييس بدون كراش أو تحديث قسري
                } else {
                    alert(`فشل رفع ومعالجة الملف: ${result.detail || "خطأ غير معروف"}`);
                }
            } catch (error) {
                console.error("Upload Error:", error);
                alert("حدث خطأ في الاتصال بالسيرفر أثناء رفع ملف الإكسيل، يرجى التحقق من استقرار نفق الاتصال.");
            } finally {
                if (fileInput) fileInput.value = ""; // تنظيف حقل الإدخال للسماح برفع نفس الملف مجدداً
                if (nameDisplay) nameDisplay.innerText = "";
            }
        });
    }

    // تشغيل الجلب المبدئي لبناء الواجهة فور فتح الصفحة
    await loadDashboardData();
});
