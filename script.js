const firebaseConfig = {
    apiKey: "AIzaSyDl51L8y775obXxODk4h58BYqz3kwedJT0",
    authDomain: "fitcal-ai-d89d8.firebaseapp.com",
    projectId: "fitcal-ai-d89d8",
    storageBucket: "fitcal-ai-d89d8.firebasestorage.app",
    messagingSenderId: "240265112974",
    appId: "1:240265112974:web:4a6f59fb9fa20f6f2348df",
    measurementId: "G-070DHH82RM"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let deviceId = localStorage.getItem('deviceId');
if (!deviceId) {
    deviceId = 'user_' + Date.now();
    localStorage.setItem('deviceId', deviceId);
}
const userRef = db.collection('users').doc(deviceId);

let userData = { tdee: 0 };
let dailyFoods = [];
let waterCount = 0; // ตัวแปรเก็บจำนวนแก้วน้ำ

async function syncToFirebase() {
    try {
        await userRef.set({
            userData: userData,
            dailyFoods: dailyFoods,
            waterCount: waterCount, // บันทึกค่าน้ำขึ้น Cloud
            savedDate: new Date().toLocaleDateString('th-TH')
        });
    } catch (error) {
        console.error("Firebase Error:", error);
    }
}

async function loadFromFirebase() {
    try {
        const doc = await userRef.get();
        const todayDate = new Date().toLocaleDateString('th-TH');

        if (doc.exists) {
            const data = doc.data();
            userData = data.userData || { tdee: 0 };
            
            if (data.savedDate !== todayDate) {
                dailyFoods = []; 
                waterCount = 0; // ขึ้นวันใหม่ รีเซ็ตน้ำเป็น 0
                syncToFirebase(); 
            } else {
                dailyFoods = data.dailyFoods || [];
                waterCount = data.waterCount || 0; // ดึงค่าน้ำของวันนี้มา
            }
        } else {
            syncToFirebase(); 
        }
        updateUIOnLoad();
    } catch (error) {
        updateUIOnLoad();
    }
}

function updateUIOnLoad() {
    if (userData.tdee > 0) {
        document.getElementById('tdee-result').classList.remove('hidden');
        document.getElementById('tdee-value').innerText = userData.tdee;
        if(userData.age) document.getElementById('age').value = userData.age;
        if(userData.weight) document.getElementById('weight').value = userData.weight;
        if(userData.height) document.getElementById('height').value = userData.height;
    }
    updateDashboard();
    renderFoodList();
    updateWaterUI(); // อัปเดตหน้าจอน้ำตอนเปิดแอป
}

function initApp() {
    loadFromFirebase(); 
}

// --- ระบบดื่มน้ำ (Water Tracker) ---
function updateWater(change) {
    waterCount += change;
    if (waterCount < 0) waterCount = 0; // กันติดลบ
    
    updateWaterUI();
    syncToFirebase(); // อัปเดตขึ้นฐานข้อมูลทันที
}

function updateWaterUI() {
    document.getElementById('water-count').innerText = waterCount;
    // คำนวณหลอดพลังงาน (เป้าหมาย 8 แก้ว)
    let fillPercentage = Math.min((waterCount / 8) * 100, 100);
    document.getElementById('water-fill').style.width = fillPercentage + '%';
}
// ---------------------------------

function openMenu() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebar-overlay').classList.add('open');
}

function closeMenu() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('open');
}

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
    syncToFirebase(); 
    
    document.getElementById('tdee-result').classList.remove('hidden');
    document.getElementById('tdee-value').innerText = tdee;
    updateDashboard();
    
    alert("บันทึกเป้าหมายเรียบร้อยครับ!");
    closeMenu(); 
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

function saveAndRefresh() {
    syncToFirebase(); 
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
            closeMenu(); 
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
    if(confirm("ต้องการล้างประวัติของวันนี้ใช่ไหม? (รวมถึงประวัติน้ำด้วย)")) {
        dailyFoods = [];
        waterCount = 0;
        updateWaterUI();
        saveAndRefresh();
        closeMenu();
    }
}

initApp();
