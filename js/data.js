document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('teacher-data-form');
    const teacherNameInput = document.getElementById('teacher-name');
    const teacherMailInput = document.getElementById('teacher-mail');
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
    console.log('教師姓名:', teacherName); // 調試訊息
    teacherNameInput.value = teacherName;

    const teacherMail = localStorage.getItem('teacherMail') || '';
    console.log('教師信箱:', teacherMail); // 調試訊息
    teacherMailInput.value = teacherMail;

    const teacherID = teacherName+"_"+teacherMail;

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
    queryParams.append("teacherID", teacherID);
    queryParams.append("action", "updateTeacherData");

    // 1. 取得 experienceYear 和 experienceDetail 的資料
    const years = Array.from(document.getElementsByName("experienceYear[]")).map(el => el.value.trim());
    const details = Array.from(document.getElementsByName("experienceDetail[]")).map(el => el.value.trim());

    // 2. 組合成一個字串，格式為 "年：內容"，並且每筆資料用分號分隔
    const experiences = years.map((year, index) => {
        const detail = details[index] || "";  // 如果沒有內容，使用空字串
        return `${year}：${detail}`;
    }).join(";");  // 用分號分隔每一筆經歷

    // 3. 加入到 queryParams 中
    queryParams.append("experienceCombined", experiences);

    // 4. 遍歷表單其他欄位
    Array.from(form.elements).forEach(element => {
        if (element.name && element.name !== "teacherName" && element.name !== "experienceYear[]" && element.name !== "experienceDetail[]") { 
            if (element.type === "checkbox") {
                queryParams.append(element.name, element.checked ? "是" : "");
            } else {
                queryParams.append(element.name, element.value.trim());
            }
        }
    });

    const scriptURL = "https://script.google.com/macros/s/AKfycbxOXXjxTFvtRR48Nr-EHa_vUzcSis3mKPPVyEkr7w7U3IsK4jI1XHQI3yy-f4aHQVHydw/exec";
    const fullURL = `${scriptURL}?${queryParams.toString()}`;
    console.log("API URL:", fullURL); // 調試訊息

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
    const scriptURL = "https://script.google.com/macros/s/AKfycbxOXXjxTFvtRR48Nr-EHa_vUzcSis3mKPPVyEkr7w7U3IsK4jI1XHQI3yy-f4aHQVHydw/exec";
    const url = `${scriptURL}?action=getTeacherData&teacherID=${encodeURIComponent(teacherID)}`;
    console.log("API URL:", url); // 調試訊息

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
            console.log("API 返回的資料:", data); // 調試訊息

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

            // 處理經驗數據 - 使用正確的屬性名稱 experienceYears 和 experienceDetails
            const experienceYears = data["experienceYears"];  // 修正: 使用後端實際返回的屬性名
            const experienceDetails = data["experienceDetails"];  // 修正: 使用後端實際返回的屬性名
            const inputContainer = document.getElementById("input-container");
            
            // 清空現有的 input 和 select
            inputContainer.innerHTML = "";
            
            // 設置經驗容器的樣式
            inputContainer.classList.add("experience-container");
            
            // 檢查是否有原始的 Experience 欄位資料，但 experienceYears/Details 為空
            let hasExperienceData = false;
            if (!experienceYears || !experienceDetails || experienceYears.length === 0 || experienceDetails.length === 0) {
                // 嘗試從原始數據提取經驗資料
                const experienceEntries = [];
                
                // 檢查是否有 Experience1-15 欄位存在
                for (let i = 1; i <= 15; i++) {
                    const expKey = `Experience${i}`;
                    if (data[expKey] && data[expKey].trim() !== "") {
                        console.log(`找到 ${expKey}: ${data[expKey]}`);
                        
                        // 嘗試解析格式如 "111：專題探究課程召集人"
                        const expValue = data[expKey];
                        const match = expValue.match(/^(\d+)[\s：:]+(.+)$/);
                        
                        if (match) {
                            experienceEntries.push({
                                year: match[1].trim(),
                                detail: match[2].trim()
                            });
                        } else {
                            experienceEntries.push({
                                year: "",
                                detail: expValue.trim()
                            });
                        }
                        
                        hasExperienceData = true;
                    }
                }
                
                // 使用提取的數據創建界面
                if (hasExperienceData) {
                    experienceEntries.forEach(entry => {
                        createExperienceRow(inputContainer, entry.year, entry.detail);
                    });
                }
            } else if (Array.isArray(experienceYears) && Array.isArray(experienceDetails)) {
                // 使用後端處理好的 experienceYears 和 experienceDetails 數組
                experienceYears.forEach((year, index) => {
                    createExperienceRow(inputContainer, year, experienceDetails[index] || "");
                });
                hasExperienceData = true;
            }
            
            // 如果沒有找到任何經驗資料，添加一個空白行
            if (!hasExperienceData) {
                console.log("未找到任何經驗資料，添加空白行");
                addNewExperienceRow(inputContainer);
            }
            
            // 將「新增經驗」按鈕移至外部容器
            const addButtonContainer = document.getElementById("add-button-container") || createAddButtonContainer();
            
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
            hideLoading();
        });

    // 創建「新增經驗」按鈕容器
    function createAddButtonContainer() {
        // 檢查是否已存在
        let container = document.getElementById("add-button-container");
        if (container) return container;
        
        // 創建容器元素
        container = document.createElement("div");
        container.id = "add-button-container";
        container.classList.add("text-center", "mt-3");
        
        // 創建「新增經驗」按鈕
        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.innerHTML = '<i class="fas fa-plus-circle"></i> 新增經驗';
        addButton.classList.add("btn", "btn-primary");
        addButton.addEventListener("click", function() {
            addNewExperienceRow(document.getElementById("input-container"));
        });
        
        container.appendChild(addButton);
        
        // 將容器插入到 input-container 後面
        const inputContainer = document.getElementById("input-container");
        inputContainer.parentNode.insertBefore(container, inputContainer.nextSibling);
        
        return container;
    }

    // 在頁面加載時創建「新增經驗」按鈕容器
    createAddButtonContainer();

    // 創建一個帶有預設值的經驗行
    function createExperienceRow(container, yearValue, detailValue) {
        // 創建行容器
        const rowContainer = document.createElement("div");
        rowContainer.classList.add("experience-row", "d-flex", "align-items-center", "justify-content-center", "mb-2");
        
        // 創建 select 元素
        const select = document.createElement("select");
        select.name = `experienceYear[]`;
        select.classList.add("select-style", "form-control", "mr-2");
        select.style.width = "120px"; // 固定寬度
        
        const currentYear = new Date().getFullYear();  // 取得西元年
        const currentROCYear = currentYear - 1911;     // 轉換為民國年

        for (let i = 106; i <= currentROCYear; i++) {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = i + "年";
            select.appendChild(option);
        }
        
        // 如果有數字年份，嘗試設置選中值
        if (yearValue) {
            const yearNum = parseInt(yearValue);
            if (!isNaN(yearNum)) {
                // 尋找對應的選項
                for (let i = 0; i < select.options.length; i++) {
                    if (parseInt(select.options[i].value) === yearNum) {
                        select.options[i].selected = true;
                        break;
                    }
                }
            } else {
                // 如果不是數字，添加一個特殊選項
                const option = document.createElement("option");
                option.value = yearValue;
                option.textContent = yearValue;
                option.selected = true;
                select.appendChild(option);
            }
        }

        // 創建 input 元素
        const input = document.createElement("input");
        input.type = "text";
        input.name = `experienceDetail[]`;
        input.classList.add("input-style", "form-control", "mx-2");
        input.placeholder = "請輸入詳細經歷";
        input.value = detailValue || "";
        input.style.flex = "1"; // 讓輸入框佔用最大空間

        // 創建移除按鈕（使用圖標）
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
        removeButton.classList.add("btn", "btn-danger", "btn-sm");
        removeButton.title = "移除此經驗";
        removeButton.addEventListener("click", function() {
            // 移除整行
            container.removeChild(rowContainer);
        });

        // 將元素放入行容器中
        rowContainer.appendChild(select);
        rowContainer.appendChild(input);
        rowContainer.appendChild(removeButton);
        
        // 將行容器放入主容器
        container.appendChild(rowContainer);
    }

    // 新增一個空白的經驗行
    function addNewExperienceRow(container) {
        createExperienceRow(container, "", "");
    }

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

    // 為使用 Font Awesome 圖標而添加的 CSS
    function addFontAwesomeCSS() {
        if (!document.getElementById('font-awesome-css')) {
            const link = document.createElement('link');
            link.id = 'font-awesome-css';
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
            document.head.appendChild(link);
        }
    }
    
    // 添加自定義 CSS 樣式
    function addCustomStyles() {
        if (!document.getElementById('custom-experience-styles')) {
            const style = document.createElement('style');
            style.id = 'custom-experience-styles';
            style.textContent = `
                .experience-container {
                    margin-bottom: 1rem;
                }
                .experience-row {
                    margin-bottom: 0.5rem;
                }
                #add-button-container {
                    margin-top: 1rem;
                    margin-bottom: 1rem;
                    text-align: center;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // 添加所需的 CSS
    addFontAwesomeCSS();
    addCustomStyles();
});
