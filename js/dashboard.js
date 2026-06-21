document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    
    // 1. التحقق الصارم: إذا لم يكن هناك توكن، اخرج فوراً
    if (!token) {
        console.log("No token found, redirecting to login...");
        window.location.href = 'index.html';
        return;
    }

    // رابط السيرفر الحالي المتصل عبر ngrok (تأكد من مطابقته للرابط الحالي عندك)
    const API_BASE_URL = 'https://veteran-antibody-strep.ngrok-free.dev/api';

    // متغيرات للاحتفاظ بمراجع الرسوم البيانية لتحديثها لاحقاً
    let revenueTrendChart = null;
    let leadSourceChart = null;

    // دالة رئيسية لجلب البيانات ورسم اللوحة
    async function loadDashboardData() {
        try {
            // جلب إعدادات اللوحة العامة (العنوان والاسم المخصص)
            const configResponse = await fetch(`${API_BASE_URL}/dashboard`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (configResponse.ok) {
                const configData = await configResponse.json();
                document.getElementById('dashboard-title').innerText = configData.dashboard_name;
            } else if (configResponse.status === 401) {
                // إذا انتهت صلاحية التوكن أو كان خاطئاً، اخرج بصمت
                localStorage.removeItem('access_token');
                window.location.href = 'index.html';
                return;
            }

            // جلب المقاييس والبيانات التحليلية الخاصة بعلي
            const analyticsResponse = await fetch(`${API_BASE_URL}/dashboard/analytics`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!analyticsResponse.ok) throw new Error('Failed to fetch analytics data');
            const data = await analyticsResponse.json();

            // تحديث الكروت الرقمية الثلاثة الـ KPIs
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

            // رسم أو تحديث منحنى الإيرادات الشهري (Line Chart)
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

            // رسم أو تحديث توزيع الإيرادات حسب المصدر (Horizontal Bar Chart)
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
    // الاستماع لحدث رفع ملف الـ Excel بأمان تام
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
                // إصلاح خطأ الـ fetch هنا: أضفنا الـ Body المفقود مسبقاً!
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
                    await loadDashboardData(); // إعادة التحميل الفوري للبيانات حياً
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

    // تشغيل الدالة المبدئية عند فتح الصفحة لأول مرة بأمان
    await loadDashboardData();
});
