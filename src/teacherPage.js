import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "../firebaseConfig.js";

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 로그아웃 버튼 이벤트
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await signOut(auth);
        window.location.href = "index.html"; // 로그아웃 후 이동
      } catch (error) {
        console.error("로그아웃 실패:", error);
      }
    });
  }
});

// 로그인 상태 확인 및 답안 목록 표시
const list = document.getElementById("answer-list");

onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  try {
    const snap = await getDocs(collection(db, "answers"));
    list.innerHTML = "";
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const li = document.createElement("li");
      li.textContent = `[${data.questionId}] ${data.uid}: ${data.answer}`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("답안 목록 로드 실패:", err);
  }
});
