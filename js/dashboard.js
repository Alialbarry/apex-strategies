document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    
    // طباعة التوكن في الكونسول للتأكد من وجوده أثناء الفحص
    console.log("Current Token found:", token);
    
    if (!token) {
        console.log("No token found, redirecting to login...");
        window.location.href = 'index.html';
        return;
    }

    // رابط السيرفر المتصل عبر ngrok
    const API_BASE_URL = 'https://veteran-antibody-strep.ngrok-free.dev/api';

    let revenueTrendChart = null;
    let leadSourceChart = null;

    async function loadDashboardData() {
        try {
            console.log("Attempting to fetch layout from:", `${API_BASE_URL}/dashboard`);
            
            // 1. جلب إعدادات اللوحة العامة
            const configResponse = await fetch(`${API_BASE_URL}/dashboard`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log("Config Response Status:", configResponse.status);

            if (configResponse.ok) {
                const configData = await configResponse.json();
                const titleEl = document.getElementById('dashboard-title');
                if (titleEl) titleEl.innerText = configData.dashboard_name;
            } else if (configResponse.status === 401 || configResponse.status === 403) {
                console.log("Unauthorized! Token might be invalid.");
                // تعطيل التوجيه التلقائي مؤقتاً هنا حتى لا تخرج اللوحة من تلقاء نفسها أثناء الفحص
                // localStorage.removeItem('access_token');
                // window.location.href = 'index.html';
                return;
            }

            // 2. جلب المقاييس والبيانات التحليلية الخاصة بعلي
            const analyticsResponse = await fetch(`${API_BASE_URL}/dashboard/analytics`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!analyticsResponse.ok) throw new Error('Failed to fetch analytics data');
            const data = await analyticsResponse.json();
            console.log("Analytics Data Received:", data);

            // 3. تحديث الكروت الرقمية الثلاثة الـ KPIs
            const kpiContainer = document.getElementById('kpi-container');
            if (kpiContainer && data.length >= 3) {
                kpiContainer.innerHTML = `
                    <div class="kpi-card revenue">
                        <span>Total Revenue</span>
                        <h2>${data[0].calculated_value}</h2>
                    </div>
                    <div class="kpi-card appointments">
                        <span>Total Appointment</span>
                        <h2>${data[1].calculated_value}</h2>
                    </div>
                    <div class="kpi-card rate">
                        <span>No_Show Rate</span>
                        <h2>${data[2].calculated_value}</h2>
                    </div>
                `;
            }

            // 4. رسم أو تحديث منحنى الإيرادات الشهري (Line Chart)
            const canvasLine = document.getElementById('revenueTrendChart');
            if (canvasLine && data[3]) {
                const ctxLine = canvasLine.getContext('2d');
                if (revenueTrendChart) { revenueTrendChart.destroy(); }
                
                revenueTrendChart = new Chart(ctxLine, {
                    type: 'line',
                    data: {
                        labels: ['January', 'February', 'March', 'April'],
                        datasets: [{
                            label: 'Monthly Revenue Trend',
                            data: data[3].data_points,
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
                        plugins: { legend: { display: false } }
                    }
                });
            }

            // 5. رسم أو تحديث توزيع الإيرادات حسب المصدر (Horizontal Bar Chart)
            const canvasBar = document.getElementById('leadSourceChart');
            if (canvasBar && data[4]) {
                const ctxBar = canvasBar.getContext('2d');
                if (leadSourceChart) { leadSourceChart.destroy(); }
                
                leadSourceChart = new Chart(ctxBar, {
                    type: 'bar',
                    data: {
                        labels: ['Friend Referral', 'TikTok', 'Google Maps', 'Instagram'],
                        datasets: [{
                            data: data[4].data_points,
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
            if (nameDisplay) nameDisplay.innerText = `جاري معالجة: ${file.name}`;
            
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
                    alert(result.message);
                    await loadDashboardData(); // تحديث حركي فوري للرسوم بدون استخدام location.reload()
                } else {
                    alert(`فشل رفع ومعالجة الملف: ${result.detail}`);
                }
            } catch (error) {
                console.error("Upload Error:", error);
                alert("حدث خطأ في الاتصال بالسيرفر أثناء رفع ملف الإكسيل.");
            } finally {
                if (nameDisplay) nameDisplay.innerText = "";
            }
        });
    }

    // تشغيل الجلب المبدئي للبيانات
    await loadDashboardData();
});
