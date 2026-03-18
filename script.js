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

let userData = { tdee: 0, bmi: 0 };
let dailyFoods = [];
let waterCount = 0;
let currentSuggestedFood = null; // ตัวแปรเก็บเมนูที่ AI กำลังแนะนำ

// ฐานข้อมูลจำลองของ AI แนะนำเมนู (แคลอรี่ต่ำ-ปานกลาง)
const aiFoodDatabase = [
    { name: "แอปเปิล 1 ลูก 🍎", cal: 52 },
    { name: "ไข่ต้ม 1 ฟอง 🥚", cal: 70 },
    { name: "นมถั่วเหลืองจืด 1 กล่อง 🥛", cal: 80 },
    { name: "กล้วยหอม 1 ผล 🍌", cal: 120 },
    { name: "สลัดผักน้ำใส 🥗", cal: 150 },
    { name: "อกไก่ย่าง (100g) 🍗", cal: 165 },
    { name: "แกงจืดเต้าหู้หมูสับ 🍲", cal: 200 },
    { name: "เกาเหลาหมูตุ๋น 🍜", cal: 250 },
    { name: "ข้าวต้มปลา 🍚", cal: 320 }
];

async function syncToFirebase() {
    try {
        await userRef.set({
            userData: userData,
            dailyFoods: dailyFoods,
            waterCount: waterCount,
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
            userData = data.userData || { tdee: 0, bmi: 0 };
            
            if (data.savedDate !== todayDate) {
                dailyFoods = []; 
                waterCount = 0;
                syncToFirebase(); 
            } else {
                dailyFoods = data.dailyFoods || [];
                waterCount = data.waterCount || 0;
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
        
        // โหลดข้อมูลเก่ามาใส่ช่อง input
        if(userData.age) document.getElementById('age').value = userData.age;
        if(userData.weight) document.getElementById('weight').value = userData.weight;
        if(userData.height) document.getElementById('height').value = userData.height;
        
        // อัปเดตสี BMI ถ้าเคยคำนวณไว้แล้ว
        if(userData.bmi) renderBMI(userData.bmi);
    }
    updateDashboard();
    renderFoodList();
    updateWaterUI();
}

function initApp() {
    loadFromFirebase(); 
}

// ระบบดื่มน้ำ
function updateWater(change) {
    waterCount += change;
    if (waterCount < 0) waterCount = 0;
    updateWaterUI();
    syncToFirebase();
}

function updateWaterUI() {
    document.getElementById('water-count').innerText = waterCount;
    let fillPercentage = Math.min((waterCount / 8) * 100, 100);
    document.getElementById('water-fill').style.width = fillPercentage + '%';
}

function openMenu() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebar-overlay').classList.add('open');
}

function closeMenu() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('open');
}

// --- คำนวณ TDEE และ BMI ---
function calculateTDEE() {
    const age = document.getElementById('age').value;
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);

    if (!age || !weight || !height) {
        alert("กรุณากรอกข้อมูลให้ครบถ้วนครับ");
        return;
    }

    // 1. คำนวณ TDEE
    let bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    let tdee = Math.round(bmr * 1.2);

    // 2. คำนวณ BMI = น้ำหนัก (kg) / ส่วนสูง (m)^2
    let heightInMeter = height / 100;
    let bmi = (weight / (heightInMeter * heightInMeter)).toFixed(1);

    userData = { tdee: tdee, age: age, weight: weight, height: height, bmi: bmi };
    syncToFirebase(); 
    
    document.getElementById('tdee-result').classList.remove('hidden');
    document.getElementById('tdee-value').innerText = tdee;
    
    // 3. นำ BMI ไปแสดงสี
    renderBMI(bmi);
    
    updateDashboard();
    alert("บันทึกเป้าหมายและคำนวณ BMI เรียบร้อยครับ!");
    closeMenu(); 
}

function renderBMI(bmiValue) {
    const bmiBox = document.getElementById('bmi-status-box');
    const bmiText = document.getElementById('bmi-text');
    document.getElementById('bmi-value').innerText = bmiValue;

    // ล้างคลาสสีเก่าออกให้หมด
    bmiBox.classList.remove('bmi-blue', 'bmi-green', 'bmi-yellow', 'bmi-red');

    // กำหนดสีตามเกณฑ์
    if (bmiValue < 18.5) {
        bmiText.innerText = "ผอมไป";
        bmiBox.classList.add('bmi-blue');
    } else if (bmiValue >= 18.5 && bmiValue <= 22.9) {
        bmiText.innerText = "ปกติ เยี่ยมมาก!";
        bmiBox.classList.add('bmi-green');
    } else if (bmiValue >= 23.0 && bmiValue <= 24.9) {
        bmiText.innerText = "ท้วม/น้ำหนักเกิน";
        bmiBox.classList.add('bmi-yellow');
    } else {
        bmiText.innerText = "อ้วน";
        bmiBox.classList.add('bmi-red');
    }
}

// --- AI แนะนำเมนูอัจฉริยะ ---
function suggestFood() {
    if (userData.tdee === 0) {
        alert("กรุณาตั้งเป้าหมายในเมนู ☰ ก่อนให้ AI แนะนำนะครับ");
        return;
    }

    const totalCal = dailyFoods.reduce((sum, item) => sum + item.cal, 0);
    const remainingCal = userData.tdee - totalCal;

    if (remainingCal <= 0) {
        alert("โควตาแคลอรี่วันนี้หมดแล้วครับ! พักผ่อนดีกว่านะครับ 😴");
        return;
    }

    // อัปเดตตัวเลขแคลที่เหลือในหน้าต่าง
    document.getElementById('remaining-cal').innerText = `${remainingCal} kcal`;
    
    // ให้ AI เลือกอาหารที่ไม่เกินโควตา
    const availableFoods = aiFoodDatabase.filter(food => food.cal <= remainingCal);
    
    if (availableFoods.length === 0) {
        alert("เหลือแคลอรี่น้อยเกินไป แนะนำให้ดื่มน้ำเปล่าครับ 💧");
        return;
    }

    // สุ่มเลือก 1 เมนู
    const randomIndex = Math.floor(Math.random() * availableFoods.length);
    currentSuggestedFood = availableFoods[randomIndex];

    // แสดงผล
    document.getElementById('suggested-name').innerText = currentSuggestedFood.name;
    document.getElementById('suggested-cal').innerText = `${currentSuggestedFood.cal} kcal`;
    
    // เปิดหน้าต่าง
    document.getElementById('suggestion-modal').classList.remove('hidden');
}

// ปุ่มกดยืนยันเพิ่มอาหารจากที่ AI แนะนำ
function addSuggestedFood() {
    if (currentSuggestedFood) {
        // แอบเติมข้อมูลส่วนประกอบจำลองให้ด้วย เพื่อให้กดดูประวัติได้
        const mockIngredients = [
            { name: "วัตถุดิบหลัก", cal: currentSuggestedFood.cal - 10 },
            { name: "เครื่องปรุง", cal: 10 }
        ];
        
        dailyFoods.push({
            name: currentSuggestedFood.name + " (AI แนะนำ)",
            cal: currentSuggestedFood.cal,
            ingredients: mockIngredients
        });
        
        saveAndRefresh();
        closeModal('suggestion-modal');
    }
}
// ------------------------------

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
            setTimeout(() => {
                // เซ็ตข้อมูลลง Modal ของประวัติอาหาร
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
            }, 300);
        };
        li.innerHTML = `<span>${item.name}</span> <span><strong>${item.cal}</strong> kcal</span>`;
        list.appendChild(li);
    });
}

// อัปเดตฟังก์ชันปิด Modal ให้รองรับหลายหน้าต่าง
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
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
