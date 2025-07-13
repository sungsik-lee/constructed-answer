import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { firebaseConfig } from "../firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const unitSelect = document.getElementById("unit-select");
const questionTextInput = document.getElementById("question-text");
const questionImageInput = document.getElementById("question-image");
const saveBtn = document.getElementById("save-question");
const message = document.getElementById("save-message");
const backBtn = document.getElementById("back-btn");
const userInfoBtn = document.getElementById("user-info-btn");
const userInfoModal = document.getElementById("user-info-modal");
const closeUserInfoBtn = document.getElementById("close-user-info");
const logoutBtn = document.getElementById("logout-btn");

saveBtn.addEventListener("click", async () => {
  const unit = unitSelect.value.trim();
  const text = questionTextInput.value.trim();
  const imageFile = questionImageInput.files[0];

  if (!unit || !text) {
    message.textContent = "단원과 문항 내용을 모두 입력하세요.";
    message.style.color = "red";
    return;
  }

  saveBtn.disabled = true;
  message.textContent = "문항 저장 중...";
  message.style.color = "black";

  let imageUrl = "";

  try {
    if (imageFile) {
      const imageRef = ref(storage, `questions/${unit}_${Date.now()}`);
      await uploadBytes(imageRef, imageFile);
      imageUrl = await getDownloadURL(imageRef);
    }

    // 자동 생성 questionId (단원명 + 타임스탬프)
    const generatedQuestionId = `${unit}_${Date.now()}`;

    await setDoc(doc(db, "questions", generatedQuestionId), {
      unit,
      questionId: generatedQuestionId,
      text,
      imageUrl
    });

    message.textContent = "✅ 문항이 성공적으로 저장되었습니다.";
    message.style.color = "green";

    // 입력값 초기화
    unitSelect.value = "";
    questionTextInput.value = "";
    questionImageInput.value = "";

    setTimeout(() => {
      message.textContent = "";
    }, 2000);

  } catch (error) {
    console.error(error);
    message.textContent = "❌ 저장 중 오류가 발생했습니다.";
    message.style.color = "red";

    setTimeout(() => {
      message.textContent = "";
    }, 3000);
  } finally {
    saveBtn.disabled = false;
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

// 로그아웃 버튼
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