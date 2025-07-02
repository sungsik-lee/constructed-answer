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

backBtn.addEventListener("click", () => {
  window.location.href = "teacherPage.html"; // 뒤로 갈 페이지로 변경 가능
});
