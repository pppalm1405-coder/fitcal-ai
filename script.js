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
let currentSuggestedFood = null; 

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
        
        if(userData.age) document.getElementById('age').value = userData.age;
        if(userData.weight) document.getElementById('weight').value = userData.weight;
        if(userData.height) document.getElementById('height').value = userData.height;
        
        if(userData.bmi) renderBMI(userData.bmi);
    } else {
        // กรณีรีเซ็ตข้อมูล ต้องล้างหน้าจอด้วย
        document.getElementById('tdee-result').classList.add('hidden');
        document.getElementById('age').value = '';
        document.getElementById('weight').value = '';
        document.getElementById('height').value = '';
    }
    updateDashboard();
    renderFoodList();
    updateWaterUI();
}

function initApp() {
    loadFromFirebase(); 
}

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

function calculateTDEE() {
    const age = document.getElementById('age').value;
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);

    if (!age || !weight || !height) {
        alert("กรุณากรอกข้อมูลให้ครบถ้วนครับ");
        return;
    }

    let bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    let tdee = Math.round(bmr * 1.2);

    let heightInMeter = height / 100;
    let bmi = (weight / (heightInMeter * heightInMeter)).toFixed(1);

    userData = { tdee: tdee, age: age, weight: weight, height: height, bmi: bmi };
    syncToFirebase(); 
    
    document.getElementById('tdee-result').classList.remove('hidden');
    document.getElementById('tdee-value').innerText = tdee;
    
    renderBMI(bmi);
    
    updateDashboard();
    alert("บันทึกเป้าหมายและคำนวณ BMI เรียบร้อยครับ!");
    closeMenu(); 
}

function renderBMI(bmiValue) {
    const bmiBox = document.getElementById('bmi-status-box');
    const bmiText = document.getElementById('bmi-text');
    document.getElementById('bmi-value').innerText = bmiValue;

    bmiBox.classList.remove('bmi-blue', 'bmi-green', 'bmi-yellow', 'bmi-red');

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

    document.getElementById('remaining-cal').innerText = `${remainingCal} kcal`;
    
    const availableFoods = aiFoodDatabase.filter(food => food.cal <= remainingCal);
    
    if (availableFoods.length === 0) {
        alert("เหลือแคลอรี่น้อยเกินไป แนะนำให้ดื่มน้ำเปล่าครับ 💧");
        return;
    }

    const randomIndex = Math.floor(Math.random() * availableFoods.length);
    currentSuggestedFood = availableFoods[randomIndex];

    document.getElementById('suggested-name').innerText = currentSuggestedFood.name;
    document.getElementById('suggested-cal').innerText = `${currentSuggestedFood.cal} kcal`;
    
    document.getElementById('suggestion-modal').classList.remove('hidden');
}

function addSuggestedFood() {
    if (currentSuggestedFood) {
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

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// ล้างเฉพาะข้อมูลวันนี้
function clearData() {
    if(confirm("ต้องการล้างประวัติการทานของวันนี้ใช่ไหม?")) {
        dailyFoods = [];
        saveAndRefresh();
        closeMenu();
    }
}

// --- ล้างข้อมูลทุกอย่าง (Hard Reset) ---
function resetAllData() {
    if(confirm("🚨 คำเตือน: คุณต้องการ 'รีเซ็ตข้อมูลทุกอย่าง' ใช่หรือไม่?\n\n(ข้อมูลส่วนตัว, เป้าหมาย BMI, ประวัติการกิน และค่าน้ำ จะถูกลบทั้งหมดและไม่สามารถกู้คืนได้)")) {
        
        // 1. เคลียร์ตัวแปรทั้งหมดให้เป็นค่าเริ่มต้น
        userData = { tdee: 0, bmi: 0 };
        dailyFoods = [];
        waterCount = 0;
        
        // 2. ล้างข้อมูลในเครื่อง (LocalStorage)
        localStorage.removeItem('userData');
        localStorage.removeItem('dailyFoods');

        // 3. ซิงค์ข้อมูลที่ว่างเปล่าทับขึ้นไปบน Firebase
        syncToFirebase(); 
        
        // 4. รีเฟรชหน้าจอทั้งหมดให้กลับไปเป็นศูนย์
        updateUIOnLoad();
        
        alert("รีเซ็ตข้อมูลทั้งหมดเรียบร้อยแล้วครับ 🧹 กลับสู่จุดเริ่มต้น!");
        closeMenu();
    }
}

initApp();
