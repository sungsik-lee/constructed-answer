import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "../firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const nameEl = document.getElementById("user-name");
const emailEl = document.getElementById("user-email");
const levelEl = document.getElementById("user-level");
const gradeEl = document.getElementById("user-grade");

const genderEl = document.getElementById("user-gender");
const ageEl = document.getElementById("user-age");
const logoutBtn = document.getElementById("logout-btn");
const examSelect = document.getElementById("exam-select");
const startBtn = document.getElementById("start-evaluation");

// 영어 → 한글 매핑 테이블
const genderMap = {
  male: "남성",
  female: "여성"
};

const schoolLevelMap = {
  elementary: "초등학교",
  middle: "중학교",
  high: "고등학교"
};



onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("로그인이 필요합니다.");
    window.location.href = "index.html";
    return;
  }

  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists()) {
    const data = userDoc.data();
    nameEl.textContent = data.name || "-";
    emailEl.textContent = data.email || "-";
    levelEl.textContent = schoolLevelMap[data.schoolLevel] || "-";
    gradeEl.textContent = data.grade || "-";
    genderEl.textContent = genderMap[data.gender] || "-";
    ageEl.textContent = data.age || "-";
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (err) {
    console.error("로그아웃 실패:", err);
  }
});

// 시험 목록 불러오기
async function loadExams() {
  const examsSnapshot = await getDocs(collection(db, "exams"));
  examsSnapshot.forEach(docSnap => {
    const exam = docSnap.data();
    const option = document.createElement("option");
    option.value = docSnap.id;
    option.textContent = exam.name || "(이름 없음)";
    examSelect.appendChild(option);
  });
}

examSelect.addEventListener("change", () => {
  startBtn.disabled = !examSelect.value;
});

startBtn.addEventListener("click", () => {
  const examId = examSelect.value;
  if (!examId) {
    alert("검사를 선택하세요.");
    return;
  }
  window.location.href = `evaluationPage.html?examId=${examId}`;
});

loadExams();
