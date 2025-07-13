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
const backBtn = document.getElementById("back-btn");
const userInfoBtn = document.getElementById("user-info-btn");
const userInfoModal = document.getElementById("user-info-modal");
const closeUserInfoBtn = document.getElementById("close-user-info");
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

logoutBtn.addEventListener("click", async () => {
  const confirmed = window.confirm("정말 로그아웃 하시겠습니까?");
  if (!confirmed) return;
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
