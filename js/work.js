document.addEventListener('DOMContentLoaded', () => {
    const rotationForm = document.getElementById('rotation-form');
    const rotationHeader = document.getElementById('rotation-header');
    const rotationContent = document.getElementById('rotation-content');
    const classTeacherSelect = document.getElementById('class-teacher');
    const subjectTeacherSelect = document.getElementById('subject-teacher');
    const adminSelect = document.getElementById('admin');
    const otherSelect = document.getElementById('other');
    const copyPreviousButton = document.getElementById('copy-previous');
    const loadingSpinner = document.getElementById('loading-spinner');
    const teacherNameDisplay = document.getElementById('teacher-name-display');
    const confirmNewYearButton = document.getElementById('confirm-new-year');
    
    // 計算最新年份（西元年轉民國年）
    const currentYear = new Date().getFullYear(); // 取得西元年
    const ChinalatestYear = currentYear - 1911; // 轉換為民國年
    const latest1Year = ChinalatestYear - 1; // 前一年
    const latest2Year = ChinalatestYear - 2; // 前兩年
    let previousContent = ''; // 儲存前一年的工作內容

    // 初始化
    const teacherName = localStorage.getItem('teacherName');
    if (!teacherName) {
        alert('教師姓名缺失，請重新登入');
        window.location.href = 'index.html';
        return;
    }
    // 顯示教師名稱
    teacherNameDisplay.textContent = teacherName;

    fetchTeacherData(teacherName);
    setupDropdownLogic();

    
    
    
    console.log('最新年份:', ChinalatestYear);
    console.log('前一年份:', latest1Year);

    // 顯示等待畫面
    function showLoading() {
        loadingSpinner.classList.remove('hidden');
    }

    // 隱藏等待畫面
    function hideLoading() {
        loadingSpinner.classList.add('hidden');
    }

    // 初始化下拉選單邏輯
    function setupDropdownLogic() {
        const selects = [classTeacherSelect, subjectTeacherSelect, adminSelect, otherSelect];
        selects.forEach(select => {
            select.addEventListener('change', () => {
                if (select.value) {
                    selects.forEach(otherSelect => {
                        if (otherSelect !== select) {
                            otherSelect.disabled = true;
                            otherSelect.value = '';
                        }
                    });
                } else {
                    selects.forEach(otherSelect => {
                        otherSelect.disabled = false;
                    });
                }
            });
        });
    }

    // 渲染歷年輪動紀錄和積分到表格
    function renderTeacherData(records, scores) {
        if (!Array.isArray(records) || !Array.isArray(scores)) {
            console.error('Invalid data: records or scores is not an array', { records, scores });
            alert('無法渲染表格，資料格式錯誤');
            return;
        }
    
        // 自動補齊資料，確保長度一致
        while (records.length > scores.length) {
            scores.push({ score: '無' });
        }
    
        while (scores.length > records.length) {
            records.push({ year: '無', content: '無' });
        }
    
        // 清空表格內容
        rotationHeader.innerHTML = '';
        rotationContent.innerHTML = '';
    
        // 渲染學年度
        const yearRow = document.createElement('tr');
        const yearHeader = document.createElement('th');
        yearHeader.textContent = '學年度';
        yearRow.appendChild(yearHeader);
    
        records.forEach(record => {
            const yearCell = document.createElement('th');
            yearCell.textContent = record.year || '無';
            yearRow.appendChild(yearCell);
        });
        rotationHeader.appendChild(yearRow);
    
        // 渲染工作內容
        const contentRow = document.createElement('tr');
        const contentHeader = document.createElement('td');
        contentHeader.textContent = '工作內容';
        contentRow.appendChild(contentHeader);
    
        records.forEach(record => {
            const contentCell = document.createElement('td');
            contentCell.textContent = record.content || '無';
            contentRow.appendChild(contentCell);
        });
        rotationContent.appendChild(contentRow);
    
        // 渲染分數
        const scoreRow = document.createElement('tr');
        const scoreHeader = document.createElement('td');
        scoreHeader.textContent = '分數';
        scoreRow.appendChild(scoreHeader);
    
        scores.forEach((score, index) => {
            const scoreCell = document.createElement('td');
            scoreCell.textContent = score.score || '無';
    
            // 為從右邊數來的四個分數加上 highlight 類別
            if (index >= scores.length - 4) {
                scoreCell.classList.add('highlight');
            }
    
            scoreRow.appendChild(scoreCell);
        });
        rotationContent.appendChild(scoreRow);
    }


    // 從後端獲取教師資料
    function fetchTeacherData(teacherName) {
        showLoading();
        const baseURL = 'https://script.google.com/macros/s/AKfycbwvtY1OCFZ7O8PNau02QGQCuUK42rBTcbVT2eYHEZgujRql_S4PcOo4ELvXP7oh7G3jSg/exec';
        const params = new URLSearchParams({
            action: 'getTeacherScores',
            teacherName: teacherName
        });
        
        console.log(`${baseURL}?${params.toString()}`);
        
        fetch(`${baseURL}?${params.toString()}`)
            .then(response => response.text()) // 先以純文字取回
            .then(text => {
                console.log('Raw response:', text);
                const data = JSON.parse(text); // 手動解析 JSON
                if (data.success) {
                    console.log('Teacher Data:', data);
                    renderTeacherData(data.records, data.scores);
                } else {
                    alert(data.message || '無法獲取教師資料');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('無法獲取教師資料，請稍後再試');
            })
            .finally(() => {
                hideLoading();
            });
    }
    
    // 帶入與前學年度相同資料按鈕
    copyPreviousButton.addEventListener('click', () => {
        const yearCells = Array.from(rotationHeader.querySelectorAll('th'));

        // 列出所有表頭，方便除錯
        yearCells.forEach((cell, index) => {
            const yearText = cell.textContent.trim().replace(/[^\d]/g, '');
            console.log(`Header Index ${index}: [${yearText}]`);
        });

        // 找出最新與前一年的 index
        const yearIndex = yearCells.findIndex(cell => {
            const cellYear = cell.textContent.trim().replace(/[^\d]/g, '');
            return cellYear === String(latest1Year);
        });

        const previousIndex = yearCells.findIndex(cell => {
            const cellYear = cell.textContent.trim().replace(/[^\d]/g, '');
            return cellYear === String(latest2Year);
        });

        console.log('yearIndex (latest1Year):', yearIndex);
        console.log('previousIndex (latest2Year):', previousIndex);

    
        if (yearIndex !== -1 && previousIndex !== -1) {
            const contentCells = Array.from(rotationContent.children[0].children); // 第一行（工作內容）
            const scoreCells = Array.from(rotationContent.children[1].children);   // 第二行（分數）
    
            const previousContent = contentCells[previousIndex]?.textContent?.trim() || '';
    
            if (previousContent) {
                // 更新目前學年的工作內容
                const targetCell = contentCells[yearIndex];
                if (targetCell) {
                    targetCell.textContent = previousContent;
                    alert(`已帶入 ${latest1Year} 年的資料：${previousContent}`);
                } else {
                    alert(`找不到 ${latest1Year} 年的目標儲存格`);
                }
    
                // 清空目前學年的分數欄
                const targetScoreCell = scoreCells[yearIndex];
                if (targetScoreCell) {
                    targetScoreCell.textContent = '';
                    console.log(`已清空 ${latest1Year} 年的分數欄位`);
                }
            } else {
                alert(`找不到 ${latest2Year} 年的前一年度內容`);
            }
        } else {
            alert('找不到對應的學年度欄位');
        }
    });

    // 提交更新最新一年紀錄按鈕
    rotationForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const yearCells = Array.from(rotationHeader.querySelectorAll('th')); // 取得所有標頭單元格
        const yearIndex = yearCells.findIndex(cell => {
            const cellYear = cell.textContent.trim().replace(/[^\d]/g, '');
            return cellYear === latest1Year.toString();
        });

        if (yearIndex !== -1) {
            const contentCells = Array.from(rotationContent.children[0].children); // 取得第一行內容
            const content = contentCells[yearIndex]?.textContent?.trim() || '';
    
            if (!content || content === '無' || content === '請選擇') {
                alert(`尚未填入您 ${latest1Year} 年的工作內容`);
                return;
            }

            showLoading();
            const baseURL = 'https://script.google.com/macros/s/AKfycbwHmvXWfRDMB1XalmOsLpAB2HtrmQqd2wozekaKU28WdPB_gTOGxJksXS-oTY_E3gdO/exec';
            const params = new URLSearchParams({
                action: 'updateRotationRecord',
                teacherName: localStorage.getItem('teacherName'),
                year: latest1Year,
                content: content
            });

            fetch(`${baseURL}?${params.toString()}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('最新一年資料已成功上傳！');
                        window.location.href = 'work.html';
                    } else {
                        alert(data.message || '更新失敗，請稍後再試');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('更新失敗，請稍後再試');
                })
                .finally(() => {
                    hideLoading();
                });
        } else {
            alert(`找不到 ${latest1Year} 年的學年度，請確認表格是否正確`);
        }
    });

    
    //帶入自選工作內容按鈕
    confirmNewYearButton.addEventListener('click', () => {
        const classTeacher = classTeacherSelect.value;
        const subjectTeacher = subjectTeacherSelect.value;
        const admin = adminSelect.value;
        const other = otherSelect.value;
    
        if (!classTeacher && !subjectTeacher && !admin && !other) {
            alert('請選擇一個工作內容');
            return;
        }
    
        const newContent = classTeacher || subjectTeacher || admin || other;
    
        const yearCells = Array.from(rotationHeader.querySelectorAll('th'));
    
        // 加入除錯資訊：列出所有表頭單元格的處理後值
        yearCells.forEach((cell, index) => {
            const cleanedText = cell.textContent.trim().replace(/[^\d]/g, '');
            console.log(`Header Index ${index}:`, `[${cleanedText}]`);
        });
    
        const yearIndex = yearCells.findIndex(cell => {
            const cellYear = cell.textContent.trim().replace(/[^\d]/g, '');
            return cellYear === latest1Year.toString();
        });
    
        if (yearIndex !== -1) {
            // 取得對應年份的內容單元格
            const contentCells = Array.from(rotationContent.children[0].children); // 取得第一行的所有單元格
            const corseCells = Array.from(rotationContent.children[1].children);
            // 確認目標單元格
            const targetCell = contentCells[yearIndex];
            const targetcorse = corseCells[yearIndex];
            console .log('Target Cell:', targetCell);
            
            if (targetCell) {
                // 清空對應年份的工作內容
                targetCell.textContent = ''; 
                targetcorse.textContent = '';
    
                // 在清空之後填入新的工作內容
                targetCell.textContent = newContent;
            }

            if (targetCell) {
                targetCell.textContent = newContent; // 更新表格內容
                alert(`已將 ${latest1Year} 年的資料更新為：${newContent}`);
            } else {
                alert(`找不到 ${latest1Year} 年的工作內容單元格`);
            }
        } else {
            alert(`找不到 ${latest1Year} 年的學年度`);
        }
    });
    

    // 渲染教師總分功能
    function renderTotalScore(totalScore) {
        const scoreContainer = document.querySelector('.score-info'); // 獲取 .score-info 容器
        if (!scoreContainer) {
            console.error('未找到 .score-info 容器');
            return;
        }
    
        const scoreElement = document.createElement('div');
        scoreElement.className = 'score';
        scoreElement.textContent = `總分：${totalScore}`;
        scoreContainer.appendChild(scoreElement); // 將總分添加到 .score-info 容器中
    }

    // 從後端獲取教師總分功能
    function fetchTeacherTotalScore(teacherName) {
        showLoading();
        const baseURL = 'https://script.google.com/macros/s/AKfycbwHmvXWfRDMB1XalmOsLpAB2HtrmQqd2wozekaKU28WdPB_gTOGxJksXS-oTY_E3gdO/exec';
        const params = new URLSearchParams({
            action: 'getTeacherTotalScore',
            teacherName: teacherName
        });

        fetch(`${baseURL}?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Total Score Data:', data); // Debug: 檢查返回的數據
                    renderTotalScore(data.totalScore); // 渲染總分
                } else {
                    alert(data.message || '無法獲取教師總分');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('無法獲取教師總分，請稍後再試');
            })
            .finally(() => {
                hideLoading();
            });
    }

    // 在初始化時獲取教師總分
    fetchTeacherTotalScore(teacherName);
});
