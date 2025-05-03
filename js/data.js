document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('teacher-data-form');
    const teacherNameInput = document.getElementById('teacher-name');
    const otherCheckbox = document.getElementById('other-checkbox');
    const otherLanguageText = document.getElementById('other-language-text');
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

    // 返回首頁按鈕功能
    document.getElementById('back-to-home').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // 當勾選框狀態改變時顯示或隱藏文字框
    otherCheckbox.addEventListener('change', () => {
        if (otherCheckbox.checked) {
            otherLanguageText.style.display = 'inline-block'; // 顯示文字框
        } else {
            otherLanguageText.style.display = 'none'; // 隱藏文字框
            otherLanguageText.value = ''; // 清空文字框內容
        }
    });

    // 從 localStorage 中獲取教師姓名
    const teacherName = localStorage.getItem('teacherName') || '';
    teacherNameInput.value = teacherName;

    if (!teacherName) {
        alert('教師姓名缺失，請重新登入');
        window.location.href = 'index.html';
        return;
    }
    
    // 提交表單時的處理函數
    form.addEventListener("submit", function (event) {
    event.preventDefault();

    const confirmed = window.confirm("繳交後會覆蓋原本的資料，確定要繳交嗎？");

    if (!confirmed) {
    console.log("使用者取消提交");
    return; // ← 加這行，直接跳出，不做任何事
    }

    showLoading();

    const queryParams = new URLSearchParams();

    // ✅ 加入教師姓名（從 localStorage）
    const teacherName = localStorage.getItem("teacherName");
    if (!teacherName) {
        alert("找不到教師姓名！");
        hideLoading();
        return;
    }
    queryParams.append("teacherName", teacherName);

    // ✅ 加入 action 名稱
    queryParams.append("action", "updateTeacherData");

    // ✅ 遍歷所有欄位，包括空值與未勾選 checkbox
    Array.from(form.elements).forEach(element => {
        if (element.name && element.name !== "teacherName") { // teacherName 已加入
        if (element.type === "checkbox") {
            queryParams.append(element.name, element.checked ? "是" : "");
        } else {
            queryParams.append(element.name, element.value.trim());
        }
        }
    });

    const scriptURL = "https://script.google.com/macros/s/AKfycbzyZ0MQi6UrFr2GTHUpvLSBsp8lnaMXaVZJzKaSfpcdpLx6Pqx7-_KKT-IxirftlBPzHw/exec";
    const fullURL = `${scriptURL}?${queryParams.toString()}`;

    fetch(fullURL)
        .then(response => response.json())
        .then(data => {
        if (data.success) {
            alert("✅ 資料送出成功！");
            window.location.href = "work.html";
        } else {
            alert("⚠️ 發生錯誤：" + data.message);
        }
        hideLoading(); // 隱藏等待畫面
        })
        .catch(error => {
        console.error("錯誤:", error);
        alert("❌ 發送失敗，請稍後再試。");
        hideLoading(); // 隱藏等待畫面
        });
});
    
    // ✅ 呼叫 API 取得資料並填入表單
    const scriptURL = "https://script.google.com/macros/s/AKfycbzyZ0MQi6UrFr2GTHUpvLSBsp8lnaMXaVZJzKaSfpcdpLx6Pqx7-_KKT-IxirftlBPzHw/exec";
    const url = `${scriptURL}?action=getTeacherData&teacherName=${encodeURIComponent(teacherName)}`;

    showLoading();

    fetch(url)
        .then(res => res.json())
        .then(result => {
        if (!result.success) {
            alert("讀取失敗：" + result.message);
            hideLoading();
            return;
        }

        const data = result.data;

        // ✅ 填入資料到對應欄位
        Object.keys(data).forEach(key => {
            const element = form.elements[key];
            if (element) {
            if (element.type === "checkbox") {
                element.checked = (data[key] === "是");
            } else {
                element.value = data[key];
            }
            }
        });

        const firstChoice = form.elements["first-choice-select"].value;
        const secondChoice = form.elements["second-choice-select"].value;
        const thirdChoice = form.elements["third-choice-select"].value;

        if (
            firstChoice.includes("科任") ||
            secondChoice.includes("科任") ||
            thirdChoice.includes("科任")
        ) {
            additionalInfo.style.display = "block"; // 顯示文本框
        } else {
            additionalInfo.style.display = "none"; // 隱藏文本框
        }

        hideLoading();
        })
        .catch(err => {
        console.error("載入錯誤", err);
        alert("資料載入失敗！");
        });

        // 當選擇科任時顯示相關的文本框
        const firstChoiceSelect = document.getElementById('first-choice-select');
        const secondChoiceSelect = document.getElementById('second-choice-select');
        const thirdChoiceSelect = document.getElementById('third-choice-select');
        const additionalInfo = document.getElementById('additional-info');

        // 綁定事件
        firstChoiceSelect.addEventListener('change', showFields);
        secondChoiceSelect.addEventListener('change', showFields);
        thirdChoiceSelect.addEventListener('change', showFields);

        // 顯示或隱藏填寫框的邏輯
        function showFields() {
            var firstChoice = firstChoiceSelect.value;
            var secondChoice = secondChoiceSelect.value;
            var thirdChoice = thirdChoiceSelect.value;
        
            // 如果三個都不包含「科任」，就隱藏；否則顯示
            if (
                firstChoice.includes("科任") ||
                secondChoice.includes("科任") ||
                thirdChoice.includes("科任")
            ) {
                additionalInfo.style.display = "block";
            } else {
                additionalInfo.style.display = "none";
            }
        }

    // ✅ 限制三個志願選項不得重複
    const choiceSelects = [
        document.getElementById("first-choice-select"),
        document.getElementById("second-choice-select"),
        document.getElementById("third-choice-select")
    ];

    // 儲存原始選項
    const originalOptions = Array.from(choiceSelects[0].options).map(opt => ({
        value: opt.value,
        text: opt.text
    }));

    function updateSelectOptions() {
        const selectedValues = choiceSelects.map(select => select.value);

        choiceSelects.forEach((select, index) => {
            const currentValue = select.value;

            // 清除現有選項
            select.innerHTML = "";

            // 重建選項
            originalOptions.forEach(opt => {
                // 僅當此選項未被其他下拉選單選中，或是它是目前這個選單已選的值時才加入
                if (!selectedValues.includes(opt.value) || opt.value === currentValue || opt.value === "") {
                    const option = document.createElement("option");
                    option.value = opt.value;
                    option.text = opt.text;
                    if (opt.value === currentValue) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                }
            });
        });
    }

    // 綁定每個下拉選單的變更事件
    choiceSelects.forEach(select => {
        select.addEventListener("change", updateSelectOptions);
    });

    // 初始化一次（預填完資料後再呼叫）
    setTimeout(updateSelectOptions, 500); // 延遲呼叫確保資料已填入

});