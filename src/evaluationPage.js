import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { firebaseConfig } from "../firebaseConfig.js";

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const questionButtonsDiv = document.getElementById("question-buttons");
const questionDisplayDiv = document.getElementById("question-display");
const questionText = document.getElementById("question-text");
const answerTextarea = document.getElementById("answer-text");
const submitAnswerBtn = document.getElementById("submit-answer");
const submitMessage = document.getElementById("submit-message");
const logoutBtn = document.getElementById("logout-btn");
const backBtn = document.getElementById("back-btn");

let currentUser = null;
let currentExamId = null;
let currentQuestionId = null;
let currentDocId = null;
let examQuestionIds = [];

onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("로그인이 필요합니다.");
    window.location.href = "index.html";
    return;
  }
  currentUser = user;
  init();
});

async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  currentExamId = urlParams.get("examId");
  if (!currentExamId) {
    alert("검사 정보가 없습니다.");
    window.location.href = "studentPage.html";
    return;
  }

  try {
    const examDoc = await getDoc(doc(db, "exams", currentExamId));
    if (!examDoc.exists()) {
      questionButtonsDiv.textContent = "해당 검사를 찾을 수 없습니다.";
      return;
    }
    const examData = examDoc.data();
    examQuestionIds = Array.isArray(examData.questionIds) ? examData.questionIds : [];

    if (examQuestionIds.length === 0) {
      questionButtonsDiv.textContent = "해당 검사에 문항이 없습니다.";
      return;
    }

    questionButtonsDiv.innerHTML = "";
    const chunkSize = 10;
    const chunks = [];
    for (let i = 0; i < examQuestionIds.length; i += chunkSize) {
      chunks.push(examQuestionIds.slice(i, i + chunkSize));
    }

    let questionIndex = 1;
    for (const chunk of chunks) {
      const qSnapshot = await getDocs(
        query(collection(db, "questions"), where("__name__", "in", chunk))
      );

      qSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const btn = document.createElement("button");
        btn.textContent = questionIndex++;
        btn.classList.add("question-btn");
        btn.dataset.qid = docSnap.id;
        btn.dataset.docId = docSnap.id;
        btn.dataset.fulltext = data.text || "";
        btn.dataset.imageurl = data.imageUrl || "";
        questionButtonsDiv.appendChild(btn);

        btn.addEventListener("click", () => selectQuestion(btn));
      });
    }
  } catch (error) {
    questionButtonsDiv.textContent = "문항을 불러오는 중 오류가 발생했습니다.";
    console.error(error);
  }
}

function selectQuestion(button) {
  document.querySelectorAll(".question-btn").forEach((btn) => btn.classList.remove("active"));
  button.classList.add("active");

  currentQuestionId = button.dataset.qid;
  currentDocId = button.dataset.docId;

  questionText.textContent = button.dataset.fulltext || "";

  // 이미지가 있으면 추가
  if (button.dataset.imageurl) {
    const img = document.createElement("img");
    img.src = button.dataset.imageurl;
    img.alt = "문항 이미지";
    img.style.maxWidth = "100%";
    img.style.marginTop = "10px";
    questionText.appendChild(img);
  }

  answerTextarea.value = "";
  submitAnswerBtn.disabled = true;
  submitMessage.textContent = "";
  questionDisplayDiv.style.display = "block";
}

// 답안 입력 변화 감지해서 제출 버튼 활성화
answerTextarea.addEventListener("input", () => {
  submitAnswerBtn.disabled = answerTextarea.value.trim().length === 0;
});

submitAnswerBtn.addEventListener("click", async () => {
  if (!currentQuestionId || !currentDocId) {
    alert("문항을 선택해주세요.");
    return;
  }

  const plainText = answerTextarea.value.trim();
  if (plainText.length === 0) {
    alert("답안을 입력해주세요.");
    return;
  }

  try {
    const answerDocId = `${currentUser.uid}_${currentExamId}_${currentDocId}`;
    await setDoc(doc(db, "answers", answerDocId), {
      uid: currentUser.uid,
      examId: currentExamId,
      questionId: currentQuestionId,
      answerText: plainText,
      timestamp: new Date(),
    });

    submitMessage.style.color = "green";
    submitMessage.textContent = "답안이 성공적으로 제출되었습니다.";

    setTimeout(() => {
      submitMessage.textContent = "";
    }, 1500);
  } catch (error) {
    submitMessage.style.color = "red";
    submitMessage.textContent = "답안 제출 중 오류가 발생했습니다.";
    console.error(error);

    setTimeout(() => {
      submitMessage.textContent = "";
    }, 1500);
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (error) {
    console.error("로그아웃 실패:", error);
  }
});

backBtn.addEventListener("click", () => {
  window.location.href = "studentPage.html";
});
const finishBtn = document.getElementById("finish-btn");
finishBtn.addEventListener("click", () => {
  window.location.href = "studentPage.html"; // 이전 검사 선택 화면 URL
});
