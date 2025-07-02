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

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const messageEl = document.getElementById("message");
const roleInputs = document.querySelectorAll('input[name="role"]');

function getSelectedRole() {
  const checked = [...roleInputs].find(r => r.checked);
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
  if (!getSelectedRole()) {
    messageEl.textContent = "역할을 선택해주세요.";
    return false;
  }
  return true;
}

document.getElementById("signup-btn").addEventListener("click", async () => {
  messageEl.style.color = "red";
  messageEl.textContent = "";
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const role = getSelectedRole();

  if (!validateInput(email, password)) return;

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", userCred.user.uid), {
      uid: userCred.user.uid,
      email,
      role
    });
    messageEl.style.color = "green";
    messageEl.textContent = "회원가입 성공! 로그인 해주세요.";
  } catch (err) {
    console.error("회원가입 실패:", err);
    messageEl.textContent = "회원가입 실패: " + err.message;
  }
});

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

    window.location.href = userData.role === "student" ? "studentPage.html" : "teacherPage.html";
  } catch (err) {
    console.error("로그인 실패:", err);
    messageEl.textContent = "로그인 실패: " + err.message;
  }
});
