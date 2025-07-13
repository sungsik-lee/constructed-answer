import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  setDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "../firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 로그인 페이지 요소
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const messageEl = document.getElementById("message");
const roleInputs = document.querySelectorAll('input[name="role"]');

// 회원가입 모달 요소
const signupBtn = document.getElementById("signup-btn");
const signupModal = document.getElementById("signup-modal");
const closeSignupBtn = document.getElementById("close-signup");

const signupEmailInput = document.getElementById("signup-email");
const signupPasswordInput = document.getElementById("signup-password");
const modalRoleInputs = document.querySelectorAll('input[name="modal-role"]');
const schoolLevelSelect = document.getElementById("school-level");
const gradeInput = document.getElementById("grade");
const ageInput = document.getElementById("age");
const nameInput = document.getElementById("name");
const signupMessageEl = document.getElementById("signup-message");
const confirmSignupBtn = document.getElementById("confirm-signup-btn");
const genderInputs = document.querySelectorAll('input[name="gender"]');
const studentFieldsDiv = document.getElementById("student-fields");

function getSelectedRole() {
  const checked = [...roleInputs].find(r => r.checked);
  return checked ? checked.value : null;
}
function getSelectedModalRole() {
  const checked = [...modalRoleInputs].find(r => r.checked);
  return checked ? checked.value : null;
}
function getSelectedGender() {
  const checked = [...genderInputs].find(r => r.checked);
  return checked ? checked.value : null;
}

function validateInput(email, password) {
  if (!email) {
    messageEl.textContent = "이메일을 입력해주세요.";
    return false;
  }
  if (!email.includes("@")) {
    messageEl.textContent = "올바른 이메일 형식이 아닙니다.";
    return false;
  }
  if (!password) {
    messageEl.textContent = "비밀번호를 입력해주세요.";
    return false;
  }
  if (password.length < 6) {
    messageEl.textContent = "비밀번호는 최소 6자 이상이어야 합니다.";
    return false;
  }

  return true;
}

function validateSignupExtra(role) {
  if (!signupEmailInput.value.trim()) {
    signupMessageEl.textContent = "이메일을 입력해주세요.";
    return false;
  }
  if (!signupEmailInput.value.includes("@")) {
    signupMessageEl.textContent = "올바른 이메일 형식이 아닙니다.";
    return false;
  }
  if (!signupPasswordInput.value.trim()) {
    signupMessageEl.textContent = "비밀번호를 입력해주세요.";
    return false;
  }
  if (signupPasswordInput.value.length < 6) {
    signupMessageEl.textContent = "비밀번호는 최소 6자 이상이어야 합니다.";
    return false;
  }
  if (!role) {
    signupMessageEl.textContent = "역할을 선택해주세요.";
    return false;
  }
  if (role === "student") {
    if (!schoolLevelSelect.value) {
      signupMessageEl.textContent = "학교급을 선택해주세요.";
      return false;
    }
    if (!gradeInput.value || isNaN(gradeInput.value) || gradeInput.value < 1) {
      signupMessageEl.textContent = "학년을 올바르게 입력해주세요.";
      return false;
    }
    if (!ageInput.value || isNaN(ageInput.value) || ageInput.value < 1) {
      signupMessageEl.textContent = "나이를 올바르게 입력해주세요.";
      return false;
    }
    if (!nameInput.value.trim()) {
      signupMessageEl.textContent = "이름을 입력해주세요.";
      return false;
    }
    if (!getSelectedGender()) {
      signupMessageEl.textContent = "성별을 선택해주세요.";
      return false;
    }
  }
  return true;
}

function updateSignupFormByRole() {
  const role = getSelectedModalRole();
  if (role === "teacher") {
    studentFieldsDiv.style.display = "none";
  } else {
    studentFieldsDiv.style.display = "block";
  }
}

// 로그인 버튼 클릭
document.getElementById("login-btn").addEventListener("click", async () => {
  messageEl.style.color = "red";
  messageEl.textContent = "";
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!validateInput(email, password)) return;

  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;
    const userDoc = await getDoc(doc(db, "users", uid));
    const userData = userDoc.data();

    if (!userData || !userData.role) {
      messageEl.textContent = "사용자 역할 정보를 찾을 수 없습니다.";
      return;
    }

    switch(userData.role) {
      case "admin":
        window.location.href = "adminPage.html";
        break;
      case "teacher":
        window.location.href = "teacherPage.html";
        break;
      case "student":
        window.location.href = "studentPage.html";
        break;
      default:
        messageEl.textContent = "알 수 없는 사용자 역할입니다.";
        return;
    }
  } catch (err) {
    console.error("로그인 실패:", err);
    messageEl.textContent = "로그인 실패: " + err.message;
  }
});

// 회원가입 모달 열기
signupBtn.addEventListener("click", () => {
  signupModal.style.display = "flex";

  // 초기값 세팅
  signupEmailInput.value = emailInput.value;
  signupPasswordInput.value = passwordInput.value;
  schoolLevelSelect.value = "";
  gradeInput.value = "";
  ageInput.value = "";
  nameInput.value = "";
  signupMessageEl.textContent = "";

  // 역할도 모달 라디오와 동기화 (로그인 창 선택 기준)
  const loginRole = getSelectedRole();
  modalRoleInputs.forEach(r => r.checked = r.value === loginRole);
  updateSignupFormByRole();
});

// 회원가입 모달 닫기
closeSignupBtn.addEventListener("click", () => {
  signupModal.style.display = "none";
  signupMessageEl.textContent = "";
});

// 모달 내 역할 선택 시 학생용 추가정보 영역 표시/숨김 업데이트
modalRoleInputs.forEach(radio => {
  radio.addEventListener("change", () => {
    updateSignupFormByRole();
  });
});

// 회원가입 완료 버튼 클릭
confirmSignupBtn.addEventListener("click", async () => {
  signupMessageEl.style.color = "red";
  signupMessageEl.textContent = "";

  const email = signupEmailInput.value.trim();
  const password = signupPasswordInput.value.trim();
  const role = getSelectedModalRole();

  const schoolLevel = schoolLevelSelect.value;
  const grade = parseInt(gradeInput.value);
  const age = parseInt(ageInput.value);
  const name = nameInput.value.trim();
  const gender = getSelectedGender();

  if (!validateSignupExtra(role)) return;

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);

    // Firestore에 역할별 데이터 저장
    const userDataToSave = {
      uid: userCred.user.uid,
      email,
      role,
    };

    if (role === "student") {
      userDataToSave.schoolLevel = schoolLevel;
      userDataToSave.grade = grade;
      userDataToSave.age = age;
      userDataToSave.name = name;
      userDataToSave.gender = gender;
    } else if (role === "teacher") {
      // 교사용 추가 정보가 있다면 여기에 추가 가능
    }

    await setDoc(doc(db, "users", userCred.user.uid), userDataToSave);

    signupMessageEl.style.color = "green";
    signupMessageEl.textContent = "회원가입 성공! 모달을 닫고 로그인 해주세요.";

    setTimeout(() => {
      signupModal.style.display = "none";
      signupMessageEl.textContent = "";
      signupEmailInput.value = "";
      signupPasswordInput.value = "";
      nameInput.value = "";
      gradeInput.value = "";
      ageInput.value = "";
      schoolLevelSelect.value = "";
    }, 2000);

  } catch (err) {
    console.error("회원가입 실패:", err);
    signupMessageEl.textContent = "회원가입 실패: " + err.message;
  }
});
const loginBtn = document.getElementById("login-btn");

[emailInput, passwordInput].forEach(input => {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      loginBtn.click();
    }
  });
});
