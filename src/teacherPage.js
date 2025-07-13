import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "../firebaseConfig.js";

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM 요소들
const logoutBtn = document.getElementById("logout-btn");
const backBtn = document.getElementById("back-btn");
const userInfoBtn = document.getElementById("user-info-btn");
const userInfoModal = document.getElementById("user-info-modal");
const closeUserInfoBtn = document.getElementById("close-user-info");
const viewResultsBtn = document.getElementById("view-results-btn");

// 뒤로가기 버튼
backBtn.addEventListener("click", () => {
  window.history.back();
});

// 내 정보 버튼
userInfoBtn.addEventListener("click", () => {
  userInfoModal.style.display = "block";
});

// 모달 닫기 버튼
closeUserInfoBtn.addEventListener("click", () => {
  userInfoModal.style.display = "none";
});

// 모달 외부 클릭시 닫기
window.addEventListener("click", (event) => {
  if (event.target === userInfoModal) {
    userInfoModal.style.display = "none";
  }
});

// 내 정보 모달 ESC 닫기
window.addEventListener("keydown", (e) => {
  const userInfoModal = document.getElementById("user-info-modal");
  if (e.key === "Escape" && userInfoModal && userInfoModal.style.display === "block") {
    userInfoModal.style.display = "none";
  }
});

// 로그아웃 버튼 이벤트
    logoutBtn.addEventListener("click", async () => {
  const confirmed = window.confirm("정말 로그아웃 하시겠습니까?");
  if (!confirmed) return;
      try {
        await signOut(auth);
        window.location.href = "index.html"; // 로그아웃 후 이동
      } catch (error) {
        console.error("로그아웃 실패:", error);
      }
});

// 학생 결과 확인 버튼 이벤트
if (viewResultsBtn) {
  viewResultsBtn.addEventListener("click", () => {
    window.location.href = "resultPage.html";
  });
}

// 로그인 상태 확인 및 사용자 정보 로드
onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // 사용자 정보 로드
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      document.getElementById("user-name").textContent = data.name || "-";
      document.getElementById("user-email").textContent = data.email || "-";
    }
  } catch (error) {
    console.error("사용자 정보 로드 실패:", error);
  }
});
