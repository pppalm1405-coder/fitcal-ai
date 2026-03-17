// ตัวแปรเก็บข้อมูล
let userData = JSON.parse(localStorage.getItem('userData')) || { tdee: 0 };
let dailyFoods = JSON.parse(localStorage.getItem('dailyFoods')) || [];

// เริ่มต้นแอป
function initApp() {
    if (userData.tdee > 0) {
        document.getElementById('tdee-result').classList.remove('hidden');
        document.getElementById('tdee-value').innerText = userData.tdee;
    }
    updateDashboard();
    renderFoodList();
}

// คำนวณ TDEE (สูตร Mifflin-St Jeor แบบง่าย)
function calculateTDEE() {
    const age = document.getElementById('age').value;
    const weight = document.getElementById('weight').value;
    const height = document.getElementById('height').value;

    if (!age || !weight || !height) {
        alert("กรุณากรอกข้อมูลให้ครบถ้วนครับ");
        return;
    }

    // สมมติเป็นผู้ชายเพื่อความง่ายของโปรโตไทป์ (10*w + 6.25*h - 5*a + 5) * 1.2 (Activity)
    let bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    let tdee = Math.round(bmr * 1.2);

    userData.tdee = tdee;
    localStorage.setItem('userData', JSON.stringify(userData));
    
    document.getElementById('tdee-result').classList.remove('hidden');
    document.getElementById('tdee-value').innerText = tdee;
    updateDashboard();
}

// เพิ่มอาหารพิมพ์เอง
function addFoodManual() {
    const name = document.getElementById('food-name').value;
    const cal = parseInt(document.getElementById('food-cal').value);

    if (!name || isNaN(cal)) {
        alert("กรุณากรอกชื่อและแคลอรี่ให้ถูกต้อง");
        return;
    }

    dailyFoods.push({ name: name, cal: cal });
    saveAndRefresh();
    
    document.getElementById('food-name').value = '';
    document.getElementById('food-cal').value = '';
}

// จำลองระบบ AI แสกนรูป
function simulateAIScan() {
    // ในแอปจริง ตรงนี้จะเปิดกล้องและส่งรูปไปให้ Backend API
    alert("กำลังเปิดกล้อง และให้ AI วิเคราะห์...");
    
    setTimeout(() => {
        // จำลองผลลัพธ์จาก AI
        const mockResult = { name: "ข้าวมันไก่ (AI วิเคราะห์)", cal: 550 };
        dailyFoods.push(mockResult);
        alert(`AI วิเคราะห์เสร็จสิ้น: ${mockResult.name} = ${mockResult.cal} kcal`);
        saveAndRefresh();
    }, 1500);
}

// อัปเดตข้อมูลและหน้าจอ
function saveAndRefresh() {
    localStorage.setItem('dailyFoods', JSON.stringify(dailyFoods));
    updateDashboard();
    renderFoodList();
}

// อัปเดตหน้าปัดและ Emoji
function updateDashboard() {
    const totalCal = dailyFoods.reduce((sum, item) => sum + item.cal, 0);
    document.getElementById('calories-eaten').innerText = totalCal;

    // อัปเดตวงกลม
    let percentage = 0;
    if (userData.tdee > 0) {
        percentage = Math.min((totalCal / userData.tdee) * 100, 100);
    }
    document.querySelector('.circle-progress').style.background = `conic-gradient(#8B5CF6 ${percentage}%, #E5E7EB ${percentage}%)`;

    // ระบบ Emoji 4 ระดับ
    updateEmojiStatus(totalCal, userData.tdee);
}

function updateEmojiStatus(currentCal, targetCal) {
    const emojiIcon = document.querySelector('.emoji');
    const emojiText = document.getElementById('emoji-text');

    if (targetCal === 0) {
        emojiIcon.innerText = "🤔";
        emojiText.innerText = "กรุณาตั้งเป้าหมายก่อน";
        return;
    }

    const ratio = currentCal / targetCal;

    if (ratio < 0.8) {
        // ระดับ 1 โอเคมากๆ
        emojiIcon.innerText = "😁";
        emojiText.innerText = "เยี่ยมมาก! ทานได้อีก";
        emojiText.style.color = "#10B981";
    } else if (ratio >= 0.8 && ratio <= 1.0) {
        // ระดับ 2 กำลังดี
        emojiIcon.innerText = "🙂";
        emojiText.innerText = "กำลังดีเลย สมดุลมาก";
        emojiText.style.color = "#F59E0B";
    } else if (ratio > 1.0 && ratio <= 1.15) {
        // ระดับ 3 เกินมาหน่อย
        emojiIcon.innerText = "😟";
        emojiText.innerText = "เกินมานิดหน่อย ระวังน้า";
        emojiText.style.color = "#F97316";
    } else {
        // ระดับ 4 เกินไปมาก
        emojiIcon.innerText = "😫";
        emojiText.innerText = "วันนี้แคลอรี่ทะลุแล้ว!";
        emojiText.style.color = "#EF4444";
    }
}

// แสดงรายการอาหาร
function renderFoodList() {
    const list = document.getElementById('food-list');
    list.innerHTML = '';
    
    dailyFoods.forEach((item) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${item.name}</span> <span>${item.cal} kcal</span>`;
        list.appendChild(li);
    });
}

// ล้างข้อมูล
function clearData() {
    if(confirm("ต้องการล้างประวัติของวันนี้ใช่ไหม?")) {
        dailyFoods = [];
        saveAndRefresh();
    }
}

// รันครั้งแรกเมื่อโหลดหน้าเว็บ
initApp();
// --- ระบบวาดกราฟ Chart.js ---
let weeklyChartInstance = null;

function renderChart() {
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    
    // ถ้ามีกราฟเก่าอยู่ ให้ล้างทิ้งก่อนวาดใหม่ (ป้องกันกราฟซ้อนกัน)
    if (weeklyChartInstance) {
        weeklyChartInstance.destroy();
    }

    // คำนวณแคลอรี่ของวันนี้เพื่อไปใส่ในกราฟ
    const todayCal = dailyFoods.reduce((sum, item) => sum + item.cal, 0);

    // จำลองข้อมูล 6 วันย้อนหลัง + วันนี้ (ในสเตปต่อไปเราจะดึงของจริงจาก Firebase)
    const labels = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'วันนี้'];
    const data = [1800, 2100, 1900, 2400, 2200, 1500, todayCal];
    
    // เส้นเป้าหมาย TDEE
    const target = userData.tdee || 2000;
    const targetData = Array(7).fill(target);

    weeklyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'แคลอรี่ที่ทาน',
                    data: data,
                    backgroundColor: 'rgba(139, 92, 246, 0.7)', // สีม่วงโปร่งแสง
                    borderRadius: 6,
                },
                {
                    label: 'เป้าหมาย (TDEE)',
                    data: targetData,
                    type: 'line',
                    borderColor: '#EF4444', // สีแดงเส้นประ
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    borderDash: [5, 5] 
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false } // ซ่อนป้ายกำกับให้ดูมินิมอล
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    border: { display: false }
                },
                x: {
                    grid: { display: false },
                    border: { display: false }
                }
            }
        }
    });
}
