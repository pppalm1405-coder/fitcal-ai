// ตัวแปรเก็บข้อมูล
let userData = JSON.parse(localStorage.getItem('userData')) || { tdee: 0 };
let dailyFoods = JSON.parse(localStorage.getItem('dailyFoods')) || [];
let weeklyChartInstance = null;

// เริ่มต้นแอป
function initApp() {
    if (userData.tdee > 0) {
        document.getElementById('tdee-result').classList.remove('hidden');
        document.getElementById('tdee-value').innerText = userData.tdee;
        
        // ใส่ค่าเดิมกลับเข้าไปในช่อง input ให้ด้วย
        if(userData.age) document.getElementById('age').value = userData.age;
        if(userData.weight) document.getElementById('weight').value = userData.weight;
        if(userData.height) document.getElementById('height').value = userData.height;
    }
    updateDashboard();
    renderFoodList();
}

// คำนวณ TDEE
function calculateTDEE() {
    const age = document.getElementById('age').value;
    const weight = document.getElementById('weight').value;
    const height = document.getElementById('height').value;

    if (!age || !weight || !height) {
        alert("กรุณากรอกข้อมูลให้ครบถ้วนครับ");
        return;
    }

    let bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    let tdee = Math.round(bmr * 1.2);

    userData = { tdee: tdee, age: age, weight: weight, height: height };
    localStorage.setItem('userData', JSON.stringify(userData));
    
    document.getElementById('tdee-result').classList.remove('hidden');
    document.getElementById('tdee-value').innerText = tdee;
    updateDashboard();
}

// จำลองสมอง AI แยกส่วนประกอบ
function generateAIAnalysis(foodName) {
    const ingredients = [
        { name: "🍚 คาร์โบไฮเดรต (ข้าว/แป้ง)", cal: Math.floor(Math.random() * 150) + 120 },
        { name: "🥩 โปรตีน (เนื้อสัตว์/ไข่)", cal: Math.floor(Math.random() * 200) + 80 },
        { name: "🧈 ไขมัน (น้ำมัน/กะทิ)", cal: Math.floor(Math.random() * 100) + 40 },
        { name: "🥬 วิตามิน (ผัก/เครื่องปรุง)", cal: Math.floor(Math.random() * 30) + 10 }
    ];
    
    const totalCal = ingredients.reduce((sum, item) => sum + item.cal, 0);
    
    return { name: foodName, cal: totalCal, ingredients: ingredients };
}

// เพิ่มอาหารพิมพ์ชื่อเอง
function addFoodByName() {
    const name = document.getElementById('food-name').value;

    if (!name) {
        alert("กรุณาพิมพ์ชื่อเมนูอาหารก่อนครับ");
        return;
    }

    const aiResult = generateAIAnalysis(name);
    dailyFoods.push(aiResult);
    saveAndRefresh();
    document.getElementById('food-name').value = '';
}

// จำลอง AI แสกนรูป
function simulateAIScan() {
    alert("📸 กำลังเปิดกล้อง และให้ AI วิเคราะห์ส่วนประกอบจากภาพ...");
    setTimeout(() => {
        const aiResult = generateAIAnalysis("อาหารจากการสแกน 🍽️");
        dailyFoods.push(aiResult);
        saveAndRefresh();
    }, 1500);
}

// อัปเดตข้อมูล
function saveAndRefresh() {
    localStorage.setItem('dailyFoods', JSON.stringify(dailyFoods));
    updateDashboard();
    renderFoodList();
}

// อัปเดตหน้าปัด วงกลม อีโมจิ และ กราฟ
function updateDashboard() {
    const totalCal = dailyFoods.reduce((sum, item) => sum + item.cal, 0);
    document.getElementById('calories-eaten').innerText = totalCal;

    let percentage = 0;
    if (userData.tdee > 0) {
        percentage = Math.min((totalCal / userData.tdee) * 100, 100);
    }
    document.querySelector('.circle-progress').style.background = `conic-gradient(#8B5CF6 ${percentage}%, #E5E7EB ${percentage}%)`;

    updateEmojiStatus(totalCal, userData.tdee);
    
    // อัปเดตกราฟแท่ง
    renderChart();
}

// คำนวณ Emoji 4 ระดับ
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
        emojiIcon.innerText = "😁";
        emojiText.innerText = "เยี่ยมมาก! ทานได้อีก";
        emojiText.style.color = "#10B981";
    } else if (ratio >= 0.8 && ratio <= 1.0) {
        emojiIcon.innerText = "🙂";
        emojiText.innerText = "กำลังดีเลย สมดุลมาก";
        emojiText.style.color = "#F59E0B";
    } else if (ratio > 1.0 && ratio <= 1.15) {
        emojiIcon.innerText = "😟";
        emojiText.innerText = "เกินมานิดหน่อย ระวังน้า";
        emojiText.style.color = "#F97316";
    } else {
        emojiIcon.innerText = "😫";
        emojiText.innerText = "วันนี้แคลอรี่ทะลุแล้ว!";
        emojiText.style.color = "#EF4444";
    }
}

// แสดงรายการประวัติ
function renderFoodList() {
    const list = document.getElementById('food-list');
    list.innerHTML = '';
    
    dailyFoods.forEach((item, index) => {
        const li = document.createElement('li');
        li.onclick = () => openModal(index);
        li.innerHTML = `<span>${item.name}</span> <span><strong>${item.cal}</strong> kcal</span>`;
        list.appendChild(li);
    });
}

// ควบคุม Modal
function openModal(index) {
    const item = dailyFoods[index];
    document.getElementById('modal-title').innerText = item.name;
    
    const ul = document.getElementById('modal-ingredients');
    ul.innerHTML = '';
    
    if (item.ingredients && item.ingredients.length > 0) {
        item.ingredients.forEach(ing => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${ing.name}</span> <span>${ing.cal} kcal</span>`;
            ul.appendChild(li);
        });
    } else {
        ul.innerHTML = '<li><span>ไม่มีข้อมูลส่วนประกอบ</span></li>';
    }
    
    document.getElementById('modal-total-cal').innerText = `${item.cal} kcal`;
    document.getElementById('ingredient-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('ingredient-modal').classList.add('hidden');
}

// ล้างข้อมูล
function clearData() {
    if(confirm("ต้องการล้างประวัติของวันนี้ใช่ไหม?")) {
        dailyFoods = [];
        saveAndRefresh();
    }
}

// วาดกราฟ Chart.js
function renderChart() {
    const canvas = document.getElementById('weeklyChart');
    if (!canvas) return; // ป้องกัน error ถ้าหา canvas ไม่เจอ
    
    const ctx = canvas.getContext('2d');
    
    if (weeklyChartInstance) {
        weeklyChartInstance.destroy();
    }

    const todayCal = dailyFoods.reduce((sum, item) => sum + item.cal, 0);

    const labels = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'วันนี้'];
    const data = [1800, 2100, 1900, 2400, 2200, 1500, todayCal];
    
    const target = userData.tdee || 2000;
    const targetData = Array(7).fill(target);

    weeklyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'แคลอรี่',
                    data: data,
                    backgroundColor: 'rgba(139, 92, 246, 0.7)',
                    borderRadius: 6,
                },
                {
                    label: 'TDEE',
                    data: targetData,
                    type: 'line',
                    borderColor: '#EF4444',
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
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, border: { display: false } },
                x: { grid: { display: false }, border: { display: false } }
            }
        }
    });
}

// รันแอป
initApp();
