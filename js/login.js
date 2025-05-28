document.addEventListener('DOMContentLoaded', () => {
    localStorage.removeItem('teacherName');
    const loginForm = document.getElementById('login-form');
    const teacherNameInput = document.getElementById('teacher-name');
    const teachermailInput = document.getElementById('teacher-mail');
    const passwordInput = document.getElementById('password');
    const loadingSpinner = document.getElementById('loading-spinner');

    // 時間鎖定功能
    function checkTimeLimit() {
        // 設定截止日期和時間 (請根據需要修改)
        // 格式: 年, 月(0-11), 日, 時, 分, 秒
        const deadlineDate = new Date(2025, 5, 28, 17, 0, 0); // 2025年6月30日下午5:00
        
        const currentDate = new Date();
        
        if (currentDate > deadlineDate) {
            // 顯示鎖定遮罩
            const overlay = document.getElementById('time-lock-overlay');
            if (overlay) {
                overlay.classList.remove('hidden');
            }
            // 讓主要內容模糊並禁用互動
            const container = document.getElementById('container');
            if (container) {
                container.classList.add('blurred');
            }
            return true; // 系統已鎖定
        }
        return false; // 系統未鎖定
    }

    // 頁面載入時檢查時間限制
    const isLocked = checkTimeLimit();
    
    // 每分鐘檢查一次時間限制
    setInterval(checkTimeLimit, 60000); // 60000ms = 1分鐘
    
    // 顯示等待畫面
    function showLoading() {
        loadingSpinner.classList.remove('hidden');
    }

    // 隱藏等待畫面
    function hideLoading() {
        loadingSpinner.classList.add('hidden');
    }

    const togglePasswordIcons = document.querySelectorAll('.toggle-password');

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

    togglePasswordIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const targetId = icon.getAttribute('data-target');
            const inputField = document.getElementById(targetId);
            if (inputField) {
                togglePasswordVisibility(inputField, icon);
            }
        });
    });




    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const teacherName = teacherNameInput.value.trim();
        const teacherMail = teachermailInput.value.trim();
        const password = passwordInput.value;
        const id = `${teacherName}_${teacherMail}`;

        if (!teacherName || !password) {
            alert('請輸入教師名稱和密碼');
            return;
        }

        // 顯示等待畫面
        showLoading();

        // 發送請求到 Google Apps Script
        const baseURL = 'https://script.google.com/macros/s/AKfycbxl4muxmGpDLPvOuXQaCRYfgJK9Hc20QZJtDRu5ia_5tX7WoCoZhvQSIFrYSpRehdNqNg/exec';
        const params = new URLSearchParams({
            action: 'login',
            id: id,
            password: password
        });
        const url = `${baseURL}?${params.toString()}`;
        console.log(url); // Log the URL for debugging
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // 記住教師姓名
                    localStorage.setItem('teacherName', teacherName);
                    localStorage.setItem('teacherMail', teacherMail);

                    // 根據教師姓名判斷跳轉頁面
                    if (teacherName.toLowerCase() === 'admin') {
                        window.location.href = 'admin.html'; // 管理員跳轉
                    } else {
                        window.location.href = 'data.html'; // 一般教師跳轉
                    }
                } else {
                    alert(data.message || '登入失敗，請檢查教師名稱和密碼');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('登入失敗，請稍後再試');
            })
            .finally(() => {
                // 隱藏等待畫面
                hideLoading();
            });
    });
});
