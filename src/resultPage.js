// 기본 구조만 작성 (향후 데이터 연동/탭 기능 추가)
document.getElementById('back-btn').addEventListener('click', () => {
  window.history.back();
});
// 내 정보/로그아웃 등은 기존 teacherPage.js와 동일하게 연동 가능 

// 내 정보 모달 동작
const userInfoBtn = document.getElementById("user-info-btn");
const userInfoModal = document.getElementById("user-info-modal");
const closeUserInfoBtn = document.getElementById("close-user-info");
if (userInfoBtn && userInfoModal) {
  userInfoBtn.addEventListener("click", () => {
    userInfoModal.style.display = "block";
  });
}
if (closeUserInfoBtn && userInfoModal) {
  closeUserInfoBtn.addEventListener("click", () => {
    userInfoModal.style.display = "none";
  });
}
// ESC 키로 내 정보 모달 닫기
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && userInfoModal && userInfoModal.style.display === "block") {
    userInfoModal.style.display = "none";
  }
});
// 모달 외부 클릭 시 닫기
window.addEventListener("click", (event) => {
  if (event.target === userInfoModal) {
    userInfoModal.style.display = "none";
  }
  if (event.target === logoutModal) {
    logoutModal.style.display = "none";
  }
});

// 로그아웃 커스텀 모달 동작
const logoutBtn = document.getElementById("logout-btn");
const logoutModal = document.getElementById("logout-modal");
const logoutConfirm = document.getElementById("logout-confirm");
const logoutCancel = document.getElementById("logout-cancel");
if (logoutBtn && logoutModal) {
  logoutBtn.addEventListener("click", () => {
    logoutModal.style.display = "block";
  });
}
if (logoutCancel && logoutModal) {
  logoutCancel.addEventListener("click", () => {
    logoutModal.style.display = "none";
  });
}
if (logoutConfirm && logoutModal) {
  logoutConfirm.addEventListener("click", async () => {
    // 실제 로그아웃 처리 (teacherPage.js 참고)
    try {
      const { signOut, getAuth } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
      const { firebaseConfig } = await import("../firebaseConfig.js");
      const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      await signOut(auth);
      window.location.href = "index.html";
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  });
} 

// Firebase에서 로그인한 사용자 이메일 표시
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "../firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists()) {
    const data = userDoc.data();
    document.getElementById("user-name").textContent = data.name || "-";
    document.getElementById("user-email").textContent = data.email || user.email || "-";
  } else {
    document.getElementById("user-email").textContent = user.email || "-";
  }
}); 

// =====================
// 탭 전환 기능
// =====================
const tabQuestion = document.getElementById("tab-question");
const tabStudent = document.getElementById("tab-student");
const questionTabContent = document.getElementById("question-tab-content");
const studentTabContent = document.getElementById("student-tab-content");

tabQuestion.addEventListener("click", () => {
  tabQuestion.classList.add("active");
  tabStudent.classList.remove("active");
  questionTabContent.style.display = "block";
  studentTabContent.style.display = "none";
});
tabStudent.addEventListener("click", () => {
  tabStudent.classList.add("active");
  tabQuestion.classList.remove("active");
  questionTabContent.style.display = "none";
  studentTabContent.style.display = "block";
});

// =====================
// Firestore 데이터 로딩
// =====================
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 단원 선택 시 문항 목록 불러오기
const unitSelect = document.getElementById("unit-select");
const questionListDiv = document.getElementById("question-list");
const questionBoxDiv = document.getElementById("question-box");
const answerListDiv = document.getElementById("answer-list");

unitSelect.addEventListener("change", async () => {
  const selectedUnit = unitSelect.value;
  await loadQuestionsByUnit(selectedUnit);
});

// 단원별 문항 목록 불러오기
async function loadQuestionsByUnit(unit) {
  questionListDiv.innerHTML = "";
  questionBoxDiv.innerHTML = `<h3 class='box-title'>문항</h3>`;
  answerListDiv.innerHTML = `<h3 class='box-title'>답안 목록</h3>`;

  if (!unit) {
    questionListDiv.innerHTML = "<p>단원을 선택해주세요.</p>";
    return;
  }

  const q = query(collection(db, "questions"), where("unit", "==", unit));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    questionListDiv.innerHTML = "<p>해당 단원의 문항이 없습니다.</p>";
    return;
  }

  snapshot.forEach((doc, index) => {
    const data = doc.data();
    const btn = document.createElement("button");
    btn.className = "question-btn";
    btn.textContent = `${index + 1}번`;
    btn.title = data.text || "";
    btn.addEventListener("click", () => {
      questionListDiv.querySelectorAll(".question-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      loadAnswersForQuestion(doc.id, data);
    });
    questionListDiv.appendChild(btn);
  });
}

// 문항 선택 시 문항 내용과 답안 목록 표시
async function loadAnswersForQuestion(questionId, questionData) {
  // 문항 내용 표시
  let imageHtml = "";
  if (questionData.imageUrl) {
    imageHtml = `<img src="${questionData.imageUrl}" alt="문항 이미지" class="question-image" style="max-width:100%;max-height:300px;display:block;margin:15px auto 0;" />`;
  }
  questionBoxDiv.innerHTML = `
    <h3 class='box-title'>문항</h3>
    <div class="question-content">${questionData.text || "-"}${imageHtml}</div>
  `;

  // 답안 목록 표시
  answerListDiv.innerHTML = `<h3 class='box-title'>답안 목록</h3>`;
  const q = query(collection(db, "answers"), where("questionId", "==", questionId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    answerListDiv.innerHTML += "<i>답안이 없습니다.</i>";
    return;
  }

  const ul = document.createElement("ul");
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const li = document.createElement("li");
    li.style.listStyle = 'none';
    const card = document.createElement("div");
    card.className = "answer-card";
    card.title = data.answerText;
    card.textContent = data.answerText;
    card.onclick = () => showAnswerModalWithUser(data.answerText, data.uid);
    li.appendChild(card);
    ul.appendChild(li);
  });
  answerListDiv.appendChild(ul);
}

// 답안 모달 생성 함수 (학생 정보도 함께)
async function showAnswerModalWithUser(answerText, uid) {
  let modal = document.getElementById('answer-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'answer-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <button class="close-btn" id="close-answer-modal">&times;</button>
        <h2>답안 상세</h2>
        <div id="answer-user-info" style="margin-bottom:12px;font-size:0.98rem;color:#555;"></div>
        <div id="answer-modal-text" style="white-space:pre-wrap;word-break:break-all;font-size:1.05rem;color:#222;"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  // 학생 정보 불러오기
  let userInfoHtml = '';
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      const schoolLevelMap = { elementary: "초등학교", middle: "중학교", high: "고등학교" };
      userInfoHtml = `<b>이름:</b> ${data.name || '-'}<br><b>이메일:</b> ${data.email || '-'}<br><b>학교급:</b> ${schoolLevelMap[data.schoolLevel] || '-'}<br><b>학년:</b> ${data.grade || '-'}<br>`;
    } else {
      userInfoHtml = `<b>학생 정보 없음</b>`;
    }
  } catch {
    userInfoHtml = `<b>학생 정보 불러오기 실패</b>`;
  }
  document.getElementById('answer-user-info').innerHTML = userInfoHtml;
  document.getElementById('answer-modal-text').textContent = answerText;
  modal.style.display = 'block';
  document.getElementById('close-answer-modal').onclick = () => { modal.style.display = 'none'; };
  window.addEventListener('keydown', function escListener(e) {
    if (e.key === 'Escape') {
      modal.style.display = 'none';
      window.removeEventListener('keydown', escListener);
    }
  });
  modal.onclick = (e) => {
    if (e.target === modal) modal.style.display = 'none';
  };
}

// 학생별 탭: 학생 목록 불러오기
const studentSelect = document.getElementById("student-select");
const studentAnswerTable = document.getElementById("student-answer-table");

async function loadStudents() {
  studentSelect.innerHTML = '<option value="">-- 학생 선택 --</option>';
  const q = query(collection(db, "users"), where("role", "==", "student"));
  const snapshot = await getDocs(q);
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const option = document.createElement("option");
    option.value = docSnap.id;
    option.textContent = data.name ? `${data.name} (${data.email})` : docSnap.id;
    studentSelect.appendChild(option);
  });
}

// 학생 선택 시 답안 표 표시
studentSelect.addEventListener("change", async () => {
  studentAnswerTable.innerHTML = "";
  const uid = studentSelect.value;
  if (!uid) return;
  // 해당 학생의 모든 답안 가져오기
  const q = query(collection(db, "answers"), where("uid", "==", uid));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    studentAnswerTable.innerHTML = "<i>답안이 없습니다.</i>";
    return;
  }
  // 검사별로 그룹화
  const examMap = {};
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (!examMap[data.examId]) examMap[data.examId] = [];
    examMap[data.examId].push(data);
  });
  // 표 생성
  for (const examId in examMap) {
    const examDoc = await getDoc(doc(db, "exams", examId));
    const examName = examDoc.exists() ? examDoc.data().name : examId;
    const table = document.createElement("table");
    table.style.marginBottom = "18px";
    table.innerHTML = `<tr><th colspan="2">${examName}</th></tr><tr><th>문항</th><th>답안</th></tr>`;
    for (const ans of examMap[examId]) {
      // 문항 내용 불러오기
      const qDoc = await getDoc(doc(db, "questions", ans.questionId));
      const qText = qDoc.exists() ? qDoc.data().text : ans.questionId;
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${qText}</td><td>${ans.answerText}</td>`;
      table.appendChild(tr);
    }
    studentAnswerTable.appendChild(table);
  }
});

// 학생별 탭 동작
const studentExamListDiv = document.getElementById("student-exam-list");
const studentQuestionListDiv = document.getElementById("student-question-list");
const studentQuestionBoxDiv = document.getElementById("student-question-box");
const studentAnswerListDiv = document.getElementById("student-answer-list");
let selectedStudentId = null;
let selectedStudentExamId = null;

studentSelect.addEventListener("change", async () => {
  selectedStudentId = studentSelect.value;
  studentExamListDiv.innerHTML = "";
  studentQuestionListDiv.innerHTML = "";
  studentQuestionBoxDiv.innerHTML = "";
  studentAnswerListDiv.innerHTML = "";
  if (!selectedStudentId) return;
  // 해당 학생이 답안 제출한 examId만 추출
  const q = query(collection(db, "answers"), where("uid", "==", selectedStudentId));
  const snapshot = await getDocs(q);
  const examIdSet = new Set();
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.examId) examIdSet.add(data.examId);
  });
  if (examIdSet.size === 0) {
    studentExamListDiv.innerHTML = '<i>응시한 검사가 없습니다.</i>';
    return;
  }
  // 해당 examId만 버튼으로 표시
  for (const examId of examIdSet) {
    const examDoc = await getDoc(doc(db, "exams", examId));
    const examName = examDoc.exists() ? examDoc.data().name : examId;
    const btn = document.createElement("button");
    btn.className = "exam-btn";
    btn.textContent = examName;
    btn.onclick = () => renderStudentQuestionsForExam(examId);
    studentExamListDiv.appendChild(btn);
  }
});

async function renderStudentExams(studentUid) {
  studentExamListDiv.innerHTML = `<h3 class='box-title'>검사 목록</h3>`;
  studentQuestionListDiv.innerHTML = `<h3 class='box-title'>문항 선택</h3>`;
  studentQuestionBoxDiv.innerHTML = `<h3 class='box-title'>문항</h3>`;
  studentAnswerListDiv.innerHTML = `<h3 class='box-title'>답안 목록</h3>`;

  if (!studentUid) {
    studentExamListDiv.innerHTML += "<p>학생을 선택해주세요.</p>";
    return;
  }

  const q = query(collection(db, "answers"), where("uid", "==", studentUid));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    studentExamListDiv.innerHTML += "<p>제출한 답안이 없습니다.</p>";
    return;
  }

  // 중복 제거된 examId 목록 생성
  const examIds = [...new Set(snapshot.docs.map(doc => doc.data().examId))];
  for (const examId of examIds) {
    const examDoc = await getDoc(doc(db, "exams", examId));
    if (!examDoc.exists()) continue;
    const examData = examDoc.data();
    const btn = document.createElement("button");
    btn.className = "exam-btn";
    btn.textContent = examData.name || examId;
    btn.addEventListener("click", () => {
      studentExamListDiv.querySelectorAll(".exam-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderStudentQuestionsForExam(examId, studentUid);
    });
    studentExamListDiv.appendChild(btn);
  }
}

async function renderStudentQuestionsForExam(examId, studentUid) {
  studentQuestionListDiv.innerHTML = `<h3 class='box-title'>문항 선택</h3>`;
  studentQuestionBoxDiv.innerHTML = `<h3 class='box-title'>문항</h3>`;
  studentAnswerListDiv.innerHTML = `<h3 class='box-title'>답안 목록</h3>`;

  const examDoc = await getDoc(doc(db, "exams", examId));
  if (!examDoc.exists()) return;
  const examData = examDoc.data();
  const questionIds = Array.isArray(examData.questionIds) ? examData.questionIds : [];

  for (let i = 0; i < questionIds.length; i++) {
    const qid = questionIds[i];
    const qDoc = await getDoc(doc(db, "questions", qid));
    const qData = qDoc.exists() ? qDoc.data() : { text: "문항 없음" };
    const btn = document.createElement("button");
    btn.className = "question-btn";
    btn.textContent = `${i + 1}번`;
    btn.title = qData.text || "";
    btn.addEventListener("click", () => {
      studentQuestionListDiv.querySelectorAll(".question-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      loadStudentAnswerForQuestion(examId, qid, qData, studentUid);
    });
    studentQuestionListDiv.appendChild(btn);
  }
}

async function loadStudentAnswerForQuestion(examId, questionId, questionData, studentUid) {
  // 문항 내용 표시
  let imageHtml = "";
  if (questionData.imageUrl) {
    imageHtml = `<img src="${questionData.imageUrl}" alt="문항 이미지" class="question-image" style="max-width:100%;max-height:300px;display:block;margin:15px auto 0;" />`;
  }
  studentQuestionBoxDiv.innerHTML = `
    <h3 class='box-title'>문항</h3>
    <div class="question-content">${questionData.text || "-"}${imageHtml}</div>
  `;

  // 답안 표시
  studentAnswerListDiv.innerHTML = `<h3 class='box-title'>답안 목록</h3>`;
  const q = query(
    collection(db, "answers"),
    where("examId", "==", examId),
    where("questionId", "==", questionId),
    where("uid", "==", studentUid)
  );
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    studentAnswerListDiv.innerHTML += "<i>답안이 없습니다.</i>";
    return;
  }

  const ul = document.createElement("ul");
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const li = document.createElement("li");
    li.style.listStyle = 'none';
    const card = document.createElement("div");
    card.className = "answer-card";
    card.title = data.answerText;
    card.textContent = data.answerText;
    li.appendChild(card);
    ul.appendChild(li);
  });
  studentAnswerListDiv.appendChild(ul);
}

// 최초 진입 시 데이터 로딩
loadStudents(); 