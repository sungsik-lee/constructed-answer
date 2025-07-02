import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { firebaseConfig } from "../firebaseConfig.js";

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOMContentLoaded 안에서 모든 요소를 안전하게 참조
document.addEventListener("DOMContentLoaded", () => {
  const unitSelect = document.getElementById("unit-select");
  const startBtn = document.getElementById("start-evaluation");
  const logoutBtn = document.getElementById("logout-btn");

  // 초기 상태에서 버튼 비활성화
  startBtn.disabled = true;
  startBtn.style.backgroundColor = "#ccc";
  startBtn.style.color = "#666";
  startBtn.style.cursor = "not-allowed";

  // 로그인 상태 확인
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      alert("로그인이 필요합니다.");
      window.location.href = "index.html";
    }
  });

  // 단원 선택 시 버튼 활성화
  unitSelect.addEventListener("change", () => {
    if (unitSelect.value) {
      startBtn.disabled = false;
      startBtn.style.backgroundColor = "#007bff";
      startBtn.style.color = "white";
      startBtn.style.cursor = "pointer";
    } else {
      startBtn.disabled = true;
      startBtn.style.backgroundColor = "#ccc";
      startBtn.style.color = "#666";
      startBtn.style.cursor = "not-allowed";
    }
  });

  // 평가 시작 버튼 클릭 시 평가 페이지로 이동
  startBtn.addEventListener("click", () => {
    const selectedUnit = unitSelect.value;
    if (!selectedUnit) {
      alert("단원을 선택해주세요.");
      return;
    }
    window.location.href = `evaluationPage.html?unit=${selectedUnit}`;
  });

  // 로그아웃 버튼 처리
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "index.html";
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  });
});
