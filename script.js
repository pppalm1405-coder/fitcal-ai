// นำเข้า Firebase SDK รูปแบบ Module (เวอร์ชัน 10)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ใส่ Config ของคุณ
const firebaseConfig = {
  apiKey: "AIzaSyDl51L8y775obXxODk4h58BYqz3kwedJT0",
  authDomain: "fitcal-ai-d89d8.firebaseapp.com",
  projectId: "fitcal-ai-d89d8",
  storageBucket: "fitcal-ai-d89d8.firebasestorage.app",
  messagingSenderId: "240265112974",
  appId: "1:240265112974:web:4a6f59fb9fa20f6f2348df",
  measurementId: "G-070DHH82RM"
};

// เริ่มต้นใช้งาน Firebase และ Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// อ้างอิงถึง HTML Elements
const foodNameInput = document.getElementById('foodName');
const caloriesInput = document.getElementById('calories');
const addBtn = document.getElementById('addBtn');
const foodList = document.getElementById('foodList');
const totalCaloriesEl = document.getElementById('totalCalories');

// สร้าง Collection ใน Firestore ชื่อ "calories_logs"
const colRef = collection(db, "calories_logs");

// 1. ฟังก์ชันเพิ่มข้อมูล (Add Data)
addBtn.addEventListener('click', async () => {
    const foodName = foodNameInput.value.trim();
    const calories = parseFloat(caloriesInput.value);

    // ตรวจสอบว่ากรอกข้อมูลครบหรือไม่
    if (foodName === "" || isNaN(calories) || calories <= 0) {
        alert("โปรดกรอกชื่ออาหารและแคลอรี่ให้ถูกต้อง");
        return;
    }

    try {
        // เพิ่มเอกสารใหม่ลงใน Firestore
        await addDoc(colRef, {
            foodName: foodName,
            calories: calories,
            createdAt: serverTimestamp() // บันทึกเวลาที่เพิ่มข้อมูล
        });
        
        // เคลียร์ค่าในช่องกรอกข้อมูล
        foodNameInput.value = '';
        caloriesInput.value = '';
        foodNameInput.focus();
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
});

// 2. ฟังก์ชันดึงข้อมูลแบบ Real-time (Read Data)
// จัดเรียงข้อมูลตามเวลาที่สร้าง จากล่าสุดไปเก่าสุด
const q = query(colRef, orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
    let totalCals = 0;
    foodList.innerHTML = ''; // เคลียร์รายการเดิมก่อนลูปใหม่

    snapshot.forEach((doc) => {
        const data = doc.data();
        
        // คำนวณแคลอรี่รวม
        totalCals += data.calories;

        // สร้าง HTML Elements สำหรับแต่ละรายการอาหาร
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="food-name">${data.foodName}</span>
            <span class="food-cal">${data.calories.toLocaleString()} kcal</span>
        `;
        foodList.appendChild(li);
    });

    // อัปเดตตัวเลขแคลอรี่รวมบนหน้าจอ
    totalCaloriesEl.textContent = totalCals.toLocaleString();
});
