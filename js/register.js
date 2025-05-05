document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const registerPassword = document.getElementById('register-password');
    const confirmPassword = document.getElementById('confirm-password');
    const registerName = document.getElementById('register-name');
    const submitButton = registerForm.querySelector('button[type="submit"]');
    const togglePasswordIcons = document.querySelectorAll('.toggle-password');
    const loadingSpinner = document.getElementById('loading-spinner');

    // 顯示等待畫面
    function showLoading() {
        loadingSpinner.classList.remove('hidden');
    }

    function hideLoading() {
        console.log('執行 hideLoading()'); // 調試訊息
        loadingSpinner.classList.add('hidden');
    }

    // 將這些函數暴露到全局作用域
    window.showLoading = showLoading;
    window.hideLoading = hideLoading;


    // 切換密碼顯示/隱藏功能
    const togglePasswordVisibility = (inputField, iconElement) => {
        if (inputField.type === 'password') {
            inputField.type = 'text';
            iconElement.innerHTML = `
                <!-- Heroicons eye -->
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
            `;
        } else {
            inputField.type = 'password';
            iconElement.innerHTML = `
                <!-- Heroicons eye-slash -->
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
            `;
        }
    };

    // 綁定切換事件
    togglePasswordIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const targetId = icon.getAttribute('data-target');
            const inputField = document.getElementById(targetId);
            togglePasswordVisibility(inputField, icon);
        });
    });

    // 建立錯誤訊息元素
    const createErrorMessage = (inputField, message) => {
        // 先清除舊的錯誤訊息
        clearErrorMessage(inputField);

        // 找到 .input-wrapper 容器
        const wrapper = inputField.closest('.input-wrapper');
        if (!wrapper) return;

        // 新增錯誤訊息元素
        const errorElement = document.createElement('small');
        errorElement.classList.add('error-message');
        errorElement.style.color = 'red';
        errorElement.style.fontSize = '0.8em';
        errorElement.style.marginTop = '4px';
        errorElement.style.display = 'block';
        errorElement.textContent = message;

        // 將錯誤訊息插入到 .input-wrapper 容器的後方
        wrapper.parentNode.insertBefore(errorElement, wrapper.nextSibling);
    };

    // 清除錯誤訊息
    const clearErrorMessage = (inputField) => {
        const wrapper = inputField.closest('.input-wrapper');
        if (!wrapper) return;
    
        // 找到 .input-wrapper 容器後方的錯誤訊息
        const errorElement = wrapper.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    };

    // 單一欄位驗證
    const validateField = (inputField) => {
        if (inputField === registerName) {
            if (!registerName.value.trim()) {
                registerName.style.borderColor = 'red';
                createErrorMessage(registerName, '教師名稱不能為空');
                return false;
            } else {
                registerName.style.borderColor = 'green';
                clearErrorMessage(registerName);
                return true;
            }
        }

        if (inputField === registerPassword) {
            const passwordValue = registerPassword.value;
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/;
            if (!passwordRegex.test(passwordValue)) {
                registerPassword.style.borderColor = 'red';
                createErrorMessage(registerPassword, '密碼必須包含英文字母和數字，且長度為8-16字元');
                return false;
            } else {
                registerPassword.style.borderColor = 'green';
                clearErrorMessage(registerPassword);
                return true;
            }
        }

        if (inputField === confirmPassword) {
            if (registerPassword.value !== confirmPassword.value) {
                confirmPassword.style.borderColor = 'red';
                createErrorMessage(confirmPassword, '密碼不一致，請重新輸入');
                return false;
            } else {
                confirmPassword.style.borderColor = 'green';
                clearErrorMessage(confirmPassword);
                return true;
            }
        }
    };

    // 更新按鈕狀態
    const updateSubmitButtonState = () => {
        const isFormValid =
            validateField(registerName) &&
            validateField(registerPassword) &&
            validateField(confirmPassword);
    };

    // 表單提交
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
    
        const isNameValid = validateField(registerName);
        const isPasswordValid = validateField(registerPassword);
        const isConfirmValid = validateField(confirmPassword);
    
        if (!(isNameValid && isPasswordValid && isConfirmValid)) {
            updateSubmitButtonState(); // 避免已開啟按鈕繼續錯送
            return; // 不送出資料
        }
    
        const teacherName = registerName.value.trim();
        const password = registerPassword.value;
    
        // 顯示等待畫面
        showLoading();
    
        // 使用 URL GET 傳送資料
        const baseURL = 'https://script.google.com/macros/s/AKfycbx1Iq3SNpX1pOZNgLHbCWvWOcTfdasgzM7A3Nhl9EL15guSZjrwAD7fo8jt6k0RD-g30Q/exec';
        const params = new URLSearchParams({
            action: 'register', // ✅ 可輕易更改為 'login'、'check' 等
            teacherName: teacherName,
            password: password
        });
        const url = `${baseURL}?${params.toString()}`;
        console.log(params.toString()); // Debug: 檢查參數是否正確
        console.log(url); // Debug: 檢查 URL 是否正確
    
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('註冊成功！');
                    window.location.href = 'index.html';
                } else {
                    alert('帳好已經註冊過，如忘記密碼請洽資訊組');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('註冊失敗，請稍後再試。');
            })
            .finally(() => {
                hideLoading(); // 隱藏等待畫面
            });
    });
});
