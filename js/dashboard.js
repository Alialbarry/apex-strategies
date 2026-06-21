document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    
    // إذا لم يكن هناك توكن توثيق، يتم توجيه المستخدم لصفحة الدخول فوراً
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // رابط السيرفر الحالي المتصل عبر ngrok
    const API_BASE_URL = 'https://veteran-antibody-strep.ngrok-free.dev/api';

    // متغيرات للاحتفاظ بمراجع الرسوم البيانية حتى نتمكن من تدميرها وإعادة رسمها عند رفع ملف جديد
    let revenueTrendChart = null;
    let leadSourceChart = null;

    // دالة رئيسية لجلب البيانات ورسم اللوحة
    async function loadDashboardData() {
        try {
            // 1. جلب إعدادات اللوحة العامة (العنوان والاسم المخصص)
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
            }

            // 2. جلب المقاييس والبيانات التحليلية الخاصة بالمستخدم الحالي
            const analyticsResponse = await fetch(`${API_BASE_URL}/dashboard/analytics`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!analyticsResponse.ok) throw new Error('Failed to fetch analytics data');
            const data = await analyticsResponse.json();

            // 3. تحديث الكروت الرقمية الثلاثة الـ KPIs بالأرقام الحقيقية القادمة من السيرفر
            const kpiContainer = document.getElementById('kpi-container');
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

            // 4. رسم أو تحديث منحنى الإيرادات الشهري (Line Chart)
            const ctxLine = document.getElementById('revenueTrendChart').getContext('2d');
            if (revenueTrendChart) { revenueTrendChart.destroy(); } // تدمير الرسم القديم إن وجد لمنع التداخل
            
            revenueTrendChart = new Chart(ctxLine, {
                type: 'line',
                data: {
                    labels: ['January', 'February', 'March', 'April'],
                    datasets: [{
                        label: 'Monthly Revenue Trend',
                        data: data[3].data_points,
                        borderColor: '#E040FB', // نفس اللون البنفسجي المميز في لوحة التحكم
                        backgroundColor: 'rgba(224, 64, 251, 0.1)',
                        fill: true,
                        borderWidth: 3,
                        tension: 0.3 // نعومة وانحناء الخط
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                }
            });

            // 5. رسم أو تحديث توزيع الإيرادات حسب المصدر (Horizontal Bar Chart)
            const ctxBar = document.getElementById('leadSourceChart').getContext('2d');
            if (leadSourceChart) { leadSourceChart.destroy(); } // تدمير الرسم القديم
            
            leadSourceChart = new Chart(ctxBar, {
                type: 'bar',
                data: {
                    labels: ['Friend Referral', 'TikTok', 'Google Maps', 'Instagram'],
                    datasets: [{
                        data: data[4].data_points,
                        backgroundColor: ['#3182CE', '#319795', '#805AD5', '#D53F8C'], // توزيع ألوان احترافي مطابق
                        borderWidth: 0,
                        borderRadius: 4
                    }]
                },
                options: {
                    indexAxis: 'y', // جعل الأعمدة أفقية تماماً مثل الـ Power BI
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                }
            });

        } catch (error) {
            console.error("Error loading specific dashboard:", error);
        }
    }

    // --------------------------------------------------------
    // الاستماع لحدث رفع ملف الـ Excel ومعالجته فوراً
    // --------------------------------------------------------
    document.getElementById('excel-file-input').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // إظهار اسم الملف الحالي تحت الزر ليعرف المستخدم أنه جاري العمل
        document.getElementById('file-name-display').innerText = `جاري معالجة: ${file.name}`;
        
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE_URL}/dashboard/upload-excel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
                // نترك المتصفح يتعامل تلقائياً مع الـ Boundary الخاص بالـ FormData
            });

            const result = await response.json();
            
            if (response.ok) {
                alert(result.message);
                // إعادة تشغيل دالة جلب البيانات لتحديث كروت ورسوم الصفحة فوراً بالأرقام الجديدة!
                await loadDashboardData(); 
            } else {
                alert(`فشل رفع ومعالجة الملف: ${result.detail}`);
            }
        } catch (error) {
            console.error("Upload Error:", error);
            alert("حدث خطأ في الاتصال بالسيرفر أثناء رفع ملف الإكسيل.");
        } finally {
            // تنظيف النص بعد الانتهاء
            document.getElementById('file-name-display').innerText = "";
        }
    });

    // تشغيل الدالة المبدئية عند فتح الصفحة لأول مرة
    await loadDashboardData();
});
