import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "../firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const examNameInput = document.getElementById("exam-name");
const createBtn = document.getElementById("create-exam-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const examList = document.getElementById("exam-list");
const unitList = document.getElementById("unit-list");
const questionList = document.getElementById("question-list");
const selectedQuestions = document.getElementById("selected-questions");
const backBtn = document.getElementById("back-btn");
const userInfoBtn = document.getElementById("user-info-btn");
const userInfoModal = document.getElementById("user-info-modal");
const closeUserInfoBtn = document.getElementById("close-user-info");
const logoutBtn = document.getElementById("logout-btn");

let allQuestions = [];
let units = [];
let selectedUnit = null;

let selectedQuestionIds = [];
let editingExamId = null;

async function loadAllQuestions() {
  const querySnapshot = await getDocs(collection(db, "questions"));
  allQuestions = [];
  const unitSet = new Set();

  querySnapshot.forEach((docSnap) => {
    const q = docSnap.data();
    const qid = q.id || docSnap.id;
    if (!qid) return;

    allQuestions.push({
      id: qid,
      unit: q.unit || "단원 미지정",
      text: q.text || "내용 없음"
    });
    unitSet.add(q.unit || "단원 미지정");
  });

  units = Array.from(unitSet);
  selectedUnit = selectedUnit || (units.length > 0 ? units[0] : null);
  renderUnitButtons();
  if (selectedUnit) renderQuestionsByUnit(selectedUnit);
}

function renderUnitButtons() {
  unitList.innerHTML = "";
  units.forEach(unit => {
    const btn = document.createElement("button");
    btn.textContent = unit;
    btn.className = (unit === selectedUnit) ? "unit-btn selected" : "unit-btn";
    btn.addEventListener("click", () => {
      selectedUnit = unit;
      renderUnitButtons();
      renderQuestionsByUnit(unit);
    });
    unitList.appendChild(btn);
  });
}

function renderQuestionsByUnit(unit) {
  questionList.innerHTML = "";

  const filteredQuestions = allQuestions.filter(q => q.unit === unit);
  filteredQuestions.forEach(q => {
    const div = document.createElement("div");
    div.className = "question-item";
    div.innerHTML = `
      <label>
        <input type="checkbox" value="${q.id}" />
        (${q.unit}) ${q.text}
      </label>
    `;

    const checkbox = div.querySelector("input");
    checkbox.checked = selectedQuestionIds.includes(q.id);
    checkbox.addEventListener("change", e => {
      if (e.target.checked) {
        if (!selectedQuestionIds.includes(q.id)) selectedQuestionIds.push(q.id);
      } else {
        selectedQuestionIds = selectedQuestionIds.filter(id => id !== q.id);
      }
      renderSelectedQuestions();
    });

    questionList.appendChild(div);
  });
}

function renderSelectedQuestions() {
  selectedQuestions.innerHTML = "";
  selectedQuestionIds.forEach(id => {
    const q = allQuestions.find(q => q.id === id);
    const li = document.createElement("li");
    li.textContent = q ? `(${q.unit}) ${q.text}` : id;
    selectedQuestions.appendChild(li);
  });

  // 체크박스 상태 동기화 (현재 보여지는 단원의 문항만)
  const checkboxes = questionList.querySelectorAll("input[type=checkbox]");
  checkboxes.forEach(chk => {
    chk.checked = selectedQuestionIds.includes(chk.value);
  });
}

async function loadExams() {
  examList.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "exams"));
  querySnapshot.forEach((docSnap) => {
    const exam = docSnap.data();
    const div = document.createElement("div");
    div.className = "exam-item";
    div.innerHTML = `
      <strong>${exam.name}</strong><br />
      문항: ${Array.isArray(exam.questionIds) ? exam.questionIds.length + "개 문항" : "없음"}<br />
      <button class="edit-btn" data-id="${docSnap.id}">수정</button>
      <button class="delete-btn" data-id="${docSnap.id}">삭제</button>
    `;
    examList.appendChild(div);
  });
}

createBtn.addEventListener("click", async () => {
  const name = examNameInput.value.trim();
  if (!name) return alert("검사 이름을 입력하세요.");
  if (selectedQuestionIds.length === 0) return alert("문항을 하나 이상 선택하세요.");

  try {
    if (editingExamId) {
      await updateDoc(doc(db, "exams", editingExamId), {
        name,
        questionIds: selectedQuestionIds
      });
      alert("검사가 수정되었습니다!");
      editingExamId = null;
      createBtn.textContent = "검사 생성";
      cancelEditBtn.style.display = "none";
    } else {
      await addDoc(collection(db, "exams"), {
        name,
        questionIds: selectedQuestionIds
      });
      alert("검사가 생성되었습니다!");
    }
    examNameInput.value = "";
    selectedQuestionIds = [];
    renderSelectedQuestions();
    loadExams();
  } catch (err) {
    console.error("저장 오류:", err);
    alert("저장 중 오류가 발생했습니다. 콘솔을 확인하세요.");
  }
});

cancelEditBtn.addEventListener("click", () => {
  editingExamId = null;
  examNameInput.value = "";
  selectedQuestionIds = [];
  createBtn.textContent = "검사 생성";
  cancelEditBtn.style.display = "none";
  renderSelectedQuestions();
  renderQuestionsByUnit(selectedUnit);
});

examList.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  if (e.target.classList.contains("delete-btn")) {
    if (confirm("정말 삭제하시겠습니까?")) {
      await deleteDoc(doc(db, "exams", id));
      if (editingExamId === id) {
        cancelEditBtn.click();
      }
      loadExams();
    }
  } else if (e.target.classList.contains("edit-btn")) {
    editingExamId = id;
    createBtn.textContent = "수정 저장";
    cancelEditBtn.style.display = "inline-block";
    await loadExamForEdit(id);
  }
});

async function loadExamForEdit(id) {
  const docSnap = await getDoc(doc(db, "exams", id));
  if (!docSnap.exists()) {
    alert("해당 검사를 찾을 수 없습니다.");
    return;
  }
  const exam = docSnap.data();
  examNameInput.value = exam.name || "";
  selectedQuestionIds = Array.isArray(exam.questionIds) ? [...exam.questionIds] : [];
  renderSelectedQuestions();

  // 수정 시 첫 문항 단원으로 단원 선택
  if (selectedQuestionIds.length > 0) {
    const firstQ = allQuestions.find(q => q.id === selectedQuestionIds[0]);
    if (firstQ) {
      selectedUnit = firstQ.unit;
      renderUnitButtons();
      renderQuestionsByUnit(selectedUnit);
    }
  }
}

// 네비게이션 이벤트 리스너
backBtn.addEventListener("click", () => {
  window.history.back();
});

userInfoBtn.addEventListener("click", () => {
  userInfoModal.style.display = "block";
});

closeUserInfoBtn.addEventListener("click", () => {
  userInfoModal.style.display = "none";
});

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
    const { signOut } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
    const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
    const auth = getAuth(app);
    await signOut(auth);
    window.location.href = "index.html";
  } catch (error) {
    console.error("로그아웃 실패:", error);
  }
});

loadAllQuestions();
loadExams();
