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
const userInfoBtn = document.getElementById("user-info-btn");
const userInfoModal = document.getElementById("user-info-modal");
const closeUserInfoBtn = document.getElementById("close-user-info");
const examTitle = document.getElementById("exam-title");

// 영어 → 한글 매핑 테이블
const genderMap = {
  male: "남성",
  female: "여성",
  other: "기타"
};

const schoolLevelMap = {
  elementary: "초등학교",
  middle: "중학교",
  high: "고등학교"
};

let currentUser = null;
let currentExamId = null;
let currentQuestionId = null;
let currentDocId = null;
let examQuestionIds = [];
let submittedQuestions = new Set(); // 제출 완료된 문항 추적

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("로그인이 필요합니다.");
    window.location.href = "index.html";
    return;
  }
  currentUser = user;
  
  // 사용자 정보 로드
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      document.getElementById("user-name").textContent = data.name || "-";
      document.getElementById("user-email").textContent = data.email || "-";
      document.getElementById("user-level").textContent = schoolLevelMap[data.schoolLevel] || "-";
      document.getElementById("user-grade").textContent = data.grade || "-";
      document.getElementById("user-gender").textContent = genderMap[data.gender] || "-";
      document.getElementById("user-age").textContent = data.age || "-";
    }
  } catch (error) {
    console.error("사용자 정보 로드 실패:", error);
  }
  
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
    
    // 검사 제목 업데이트
    // 기존: document.getElementById("exam-title").textContent = examData.name;
    // 변경: 좌측 상단 라벨에 표시
    const examTitleText = document.getElementById("exam-title-text");
    if (examTitleText && examData && examData.name) {
      examTitleText.textContent = examData.name;
    }
    
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
        btn.innerHTML = `<div class="question-number">${questionIndex}번</div>`;
        btn.classList.add("question-btn");
        btn.dataset.qid = docSnap.id;
        btn.dataset.docId = docSnap.id;
        btn.dataset.fulltext = data.text || "";
        btn.dataset.imageurl = data.imageUrl || "";
        
        questionButtonsDiv.appendChild(btn);

        btn.addEventListener("click", () => selectQuestion(btn));
        questionIndex++;
      });
    }
    
    // 검사 종료 버튼을 마지막 문항 다음에 추가
    const finishBtn = document.createElement("button");
    finishBtn.innerHTML = `<div class="question-number">검사<br>종료</div>`;
    finishBtn.classList.add("question-btn", "finish-btn");
    finishBtn.id = "finish-btn";
    questionButtonsDiv.appendChild(finishBtn);
    // 검사 종료 버튼 기능 연결
    finishBtn.addEventListener("click", () => {
      // 커스텀 모달 표시
      document.getElementById("finish-modal").style.display = "block";
    });

    // 모달 버튼 이벤트 연결 (최초 1회만)
    const finishConfirm = document.getElementById("finish-confirm");
    const finishCancel = document.getElementById("finish-cancel");
    if (finishConfirm && finishCancel && !finishConfirm.dataset.bound) {
      finishConfirm.addEventListener("click", () => {
        window.location.href = "studentPage.html";
      });
      finishCancel.addEventListener("click", () => {
        document.getElementById("finish-modal").style.display = "none";
      });
      finishConfirm.dataset.bound = "true";
      finishCancel.dataset.bound = "true";
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
    img.className = "question-image";
    questionText.appendChild(img);
  }

  // 이미 제출된 문항인지 확인하고 답안 표시
  const answerDocId = `${currentUser.uid}_${currentExamId}_${currentDocId}`;
  if (submittedQuestions.has(answerDocId)) {
    // 제출된 답안 불러오기 (필요시 구현)
    answerTextarea.value = "";
  } else {
  answerTextarea.value = "";
  }
  
  submitAnswerBtn.disabled = true;
  submitMessage.textContent = "";
  questionDisplayDiv.style.display = "block";
}

// 제출 완료 상태 업데이트 함수
function updateSubmitStatus(questionId) {
  submittedQuestions.add(questionId);
  console.log("제출 완료된 문항:", questionId); // 디버깅용
  
  // 해당 문항의 제출 완료 표시 업데이트
  const questionButtons = document.querySelectorAll(".question-btn");
  console.log("찾은 버튼 수:", questionButtons.length); // 디버깅용
  
  const targetDocId = questionId.split('_')[2];
  console.log("찾고 있는 docId:", targetDocId); // 디버깅용
  
  questionButtons.forEach(btn => {
    console.log("버튼 docId:", btn.dataset.docId); // 디버깅용
    if (btn.dataset.docId === targetDocId) {
      console.log("일치하는 버튼 찾음! 업데이트 중..."); // 디버깅용
      const originalText = btn.textContent;
      console.log("원본 텍스트:", originalText); // 디버깅용
      const questionNumber = originalText.replace("번", "");
      btn.innerHTML = `<div class="question-number">${questionNumber}번</div><div class="submit-status">제출완료</div>`;
      btn.classList.add("submitted");
      console.log("업데이트된 HTML:", btn.innerHTML); // 디버깅용
    }
  });
}

// 답안 입력 변화 감지해서 제출 버튼 활성화
answerTextarea.addEventListener("input", () => {
  submitAnswerBtn.disabled = answerTextarea.value.trim().length === 0;
});

submitAnswerBtn.addEventListener("click", async () => {
  console.log("제출 버튼 클릭됨"); // 디버깅용
  
  if (!currentQuestionId || !currentDocId) {
    alert("문항을 선택해주세요.");
    return;
  }

  const plainText = answerTextarea.value.trim();
  if (plainText.length === 0) {
    alert("답안을 입력해주세요.");
    return;
  }

  // 즉시 버튼 변경 테스트
  console.log("즉시 버튼 변경 테스트 시작");
  const currentButton = document.querySelector(`.question-btn[data-doc-id="${currentDocId}"]`);
  if (currentButton) {
    console.log("현재 버튼 찾음:", currentButton);
    const questionNumber = currentButton.textContent.replace("번", "");
    currentButton.innerHTML = `<div class="question-number">${questionNumber}번</div><div class="submit-status">제출완료</div>`;
    currentButton.classList.add("submitted");
    console.log("버튼 변경 완료");
  } else {
    console.log("현재 버튼을 찾을 수 없음");
  }

  try {
    const answerDocId = `${currentUser.uid}_${currentExamId}_${currentDocId}`;
    console.log("제출할 답안 ID:", answerDocId); // 디버깅용
    
    await setDoc(doc(db, "answers", answerDocId), {
      uid: currentUser.uid,
      examId: currentExamId,
      questionId: currentQuestionId,
      answerText: plainText,
      timestamp: new Date(),
    });

    console.log("Firebase에 답안 저장 완료"); // 디버깅용

    submitMessage.style.color = "green";
    submitMessage.textContent = "답안이 성공적으로 제출되었습니다.";

    // 제출 완료 상태 업데이트
    console.log("updateSubmitStatus 호출 전"); // 디버깅용
    updateSubmitStatus(answerDocId);
    console.log("updateSubmitStatus 호출 후"); // 디버깅용

    setTimeout(() => {
      submitMessage.textContent = "";
    }, 1500);
  } catch (error) {
    submitMessage.style.color = "red";
    submitMessage.textContent = "답안 제출 중 오류가 발생했습니다.";
    console.error("제출 오류:", error);

    setTimeout(() => {
      submitMessage.textContent = "";
    }, 1500);
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
  const finishModal = document.getElementById("finish-modal");
  if (event.target === finishModal) {
    finishModal.style.display = "none";
  }
});

logoutBtn.addEventListener("click", async () => {
  const confirmed = window.confirm("정말 로그아웃 하시겠습니까?");
  if (!confirmed) return;
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (error) {
    console.error("로그아웃 실패:", error);
  }
});
const finishBtn = document.getElementById("finish-btn");
finishBtn.addEventListener("click", () => {
  window.location.href = "studentPage.html"; // 이전 검사 선택 화면 URL
});

// 내 정보 모달 ESC 닫기
window.addEventListener("keydown", (e) => {
  const userInfoModal = document.getElementById("user-info-modal");
  if (e.key === "Escape" && userInfoModal && userInfoModal.style.display === "block") {
    userInfoModal.style.display = "none";
  }
});
