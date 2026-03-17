let userData = JSON.parse(localStorage.getItem('userData')) || { tdee: 0 };
let dailyFoods = JSON.parse(localStorage.getItem('dailyFoods')) || [];

function initApp() {
    if (userData.tdee > 0) {
        document.getElementById('tdee-result').classList.remove('hidden');
        document.getElementById('tdee-value').innerText = userData.tdee;
        if(userData.age) document.getElementById('age').value = userData.age;
        if(userData.weight) document.getElementById('weight').value = userData.weight;
        if(userData.height) document.getElementById('height').value = userData.height;
    }
    updateDashboard();
    renderFoodList();
}

// --- ระบบเปิด/ปิด เมนูซ่อน (Sidebar) ---
function openMenu() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebar-overlay').classList.add('open');
}

function closeMenu() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('open');
}
// ------------------------------------

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
    
    alert("บันทึกเป้าหมายเรียบร้อยครับ!");
    closeMenu(); // คำนวณเสร็จให้ปิดเมนูอัตโนมัติ
}

function generateAIAnalysis(foodName) {
    const ingredients = [
        { name: "🍚 คาร์โบไฮเดรต", cal: Math.floor(Math.random() * 150) + 120 },
        { name: "🥩 โปรตีน", cal: Math.floor(Math.random() * 200) + 80 },
        { name: "🧈 ไขมัน", cal: Math.floor(Math.random() * 100) + 40 },
        { name: "🥬 วิตามิน/อื่นๆ", cal: Math.floor(Math.random() * 30) + 10 }
    ];
    const totalCal = ingredients.reduce((sum, item) => sum + item.cal, 0);
    return { name: foodName, cal: totalCal, ingredients: ingredients };
}

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

function simulateAIScan() {
    alert("📸 กำลังให้ AI วิเคราะห์ส่วนประกอบจากภาพ...");
    setTimeout(() => {
        const aiResult = generateAIAnalysis("เมนูจากการสแกน 🍽️");
        dailyFoods.push(aiResult);
        saveAndRefresh();
    }, 1000);
}

function saveAndRefresh() {
    localStorage.setItem('dailyFoods', JSON.stringify(dailyFoods));
    updateDashboard();
    renderFoodList();
}

function updateDashboard() {
    const totalCal = dailyFoods.reduce((sum, item) => sum + item.cal, 0);
    document.getElementById('calories-eaten').innerText = totalCal;

    let percentage = 0;
    if (userData.tdee > 0) {
        percentage = Math.min((totalCal / userData.tdee) * 100, 100);
    }
    document.querySelector('.circle-progress').style.background = `conic-gradient(#8B5CF6 ${percentage}%, #E5E7EB ${percentage}%)`;

    updateEmojiStatus(totalCal, userData.tdee);
}

function updateEmojiStatus(currentCal, targetCal) {
    const emojiIcon = document.querySelector('.emoji');
    const emojiText = document.getElementById('emoji-text');

    if (targetCal === 0) {
        emojiIcon.innerText = "🤔";
        emojiText.innerText = "กดเมนู ☰ เพื่อตั้งเป้าหมาย";
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

function renderFoodList() {
    const list = document.getElementById('food-list');
    list.innerHTML = '';
    
    if (dailyFoods.length === 0) {
        list.innerHTML = '<li style="justify-content:center; color:#9CA3AF;">ยังไม่มีประวัติการทานวันนี้</li>';
        return;
    }

    dailyFoods.forEach((item, index) => {
        const li = document.createElement('li');
        li.onclick = () => {
            closeMenu(); // ปิดเมนูก่อนโชว์ Popup
            setTimeout(() => openModal(index), 300);
        };
        li.innerHTML = `<span>${item.name}</span> <span><strong>${item.cal}</strong> kcal</span>`;
        list.appendChild(li);
    });
}

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

function clearData() {
    if(confirm("ต้องการล้างประวัติของวันนี้ใช่ไหม?")) {
        dailyFoods = [];
        saveAndRefresh();
        closeMenu();
    }
}

initApp();
