document.addEventListener('DOMContentLoaded', () => {
  // 將 tableBody 設為全局變量
  window.tableBody = document.querySelector('#teacher-table tbody');
  const loading = document.getElementById('loading-spinner');
  
  const baseUrl = 'https://script.google.com/macros/s/AKfycbzy9Mk6ych-CDs-ltEtdJl9xq-3edNnO04wZgd9lrL-ocKUoxR0i6s1VVlYTMKK0-lzRA/exec';
  const action = 'getTeacherScoreAndPreference';
  const fullUrl = `${baseUrl}?action=${action}`;
  
  loading.classList.remove('hidden');
  fetch(fullUrl)
    .then(response => response.json())
    .then(result => {
      loading.classList.add('hidden');
      if (!result.success || !Array.isArray(result.data)) {
        alert("資料格式錯誤或讀取失敗");
        return;
      }
      const teacherData = result.data;
      console.log(teacherData);
      // 分類教師：科任與非科任
      const subjectTeachers = [];
      const nonSubjectTeachers = [];
      teacherData.forEach(teacher => {
        // 修復：確保使用 teacher.firstChoice 而不是未定義的 firstChoice
        const firstChoice = teacher.firstChoice || '';
        if (typeof firstChoice === 'string' && firstChoice.includes('科任')) {
          subjectTeachers.push(teacher);
        } else {
          nonSubjectTeachers.push(teacher);
        }
      });
      // 根據分數進行排序，從高到低
      subjectTeachers.sort((a, b) => (b.score || 0) - (a.score || 0));
      nonSubjectTeachers.sort((a, b) => (b.score || 0) - (a.score || 0));
      // 合併排序後的教師數據，非科任在前，科任在後
      const sortedTeachers = [...nonSubjectTeachers, ...subjectTeachers];
      // 清空表格並重新渲染
      window.tableBody.innerHTML = '';
      // 顯示排名
      sortedTeachers.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${row.teacherName || ''}</td>
          <td>${row.score || 0}</td>
          <td class="choice" data-column="firstChoice" data-teacher="${row.teacherName}">${row.firstChoice || ''}</td>
          <td class="choice" data-column="secondChoice" data-teacher="${row.teacherName}">${row.secondChoice || ''}</td>
          <td class="choice" data-column="thirdChoice" data-teacher="${row.teacherName}">${row.thirdChoice || ''}</td>
        `;
        window.tableBody.appendChild(tr);
      });
      
      // 恢復選擇的單元格
      restoreSelectedCells();
      
      // 更新統計
      updateStatistics();
      
      // 為每個表格的選擇欄位添加點擊事件
      window.tableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('choice')) {
          const clickedCell = e.target;
          const row = clickedCell.closest('tr');
          
          // 如果點擊的是已選中的格子，則取消選擇
          if (clickedCell.classList.contains('selected')) {
            clickedCell.classList.remove('selected');
            // 從 localStorage 中移除保存的選擇
            removeSelectedCell(row.sectionRowIndex);
          } else {
            // 清除當前行的選擇
            const selectedCells = row.querySelectorAll('.choice.selected');
            selectedCells.forEach(cell => cell.classList.remove('selected'));
            // 選中當前格子
            clickedCell.classList.add('selected');
            
            // 儲存選擇的格子
            saveSelectedCell(row.sectionRowIndex, clickedCell.dataset.column);
          }
          
          // 更新統計
          updateStatistics();
        }
      });
    })
    .catch(err => {
      console.error('資料錯誤', err);
      alert('無法載入資料');
      loading.classList.add('hidden');
    });
});

// 儲存選擇的格子至 localStorage
function saveSelectedCell(rowIndex, column) {
  const selectedCells = JSON.parse(localStorage.getItem('selectedCells') || '{}');
  const row = window.tableBody.rows[rowIndex];
  const teacherName = row.cells[0].textContent.trim();
  const choiceContent = row.querySelector(`[data-column="${column}"]`).textContent.trim();
  
  // 儲存更多信息，包括選擇內容和時間戳
  selectedCells[teacherName] = {
    column: column,
    content: choiceContent,
    timestamp: new Date().toISOString()
  };
  
  localStorage.setItem('selectedCells', JSON.stringify(selectedCells));
  
  // 清理過時數據
  cleanupStorage();
}

// 從 localStorage 移除選擇的格子
function removeSelectedCell(rowIndex) {
  const selectedCells = JSON.parse(localStorage.getItem('selectedCells') || '{}');
  const row = window.tableBody.rows[rowIndex];
  const teacherName = row.cells[0].textContent.trim();
  
  delete selectedCells[teacherName];
  localStorage.setItem('selectedCells', JSON.stringify(selectedCells));
}

// 清理未使用的存儲數據
function cleanupStorage() {
  const selectedCells = JSON.parse(localStorage.getItem('selectedCells') || '{}');
  const currentTeachers = [];
  
  // 獲取當前表格中所有教師名稱
  Array.from(window.tableBody.rows).forEach(row => {
    const teacherName = row.cells[0].textContent.trim();
    currentTeachers.push(teacherName);
  });
  
  // 檢查並移除不在當前表格中的教師數據
  let hasChanges = false;
  for (const teacherName in selectedCells) {
    if (!currentTeachers.includes(teacherName)) {
      delete selectedCells[teacherName];
      hasChanges = true;
    }
  }
  
  // 如果有變更，更新存儲
  if (hasChanges) {
    localStorage.setItem('selectedCells', JSON.stringify(selectedCells));
  }
}

// 恢復選擇的格子 - 修正版本，統一合併兩個版本
function restoreSelectedCells() {
  try {
    const selectedCells = JSON.parse(localStorage.getItem('selectedCells') || '{}');
    
    // 遍歷表格所有行
    Array.from(window.tableBody.rows).forEach(row => {
      const teacherName = row.cells[0].textContent.trim();
      
      // 檢查此教師是否有保存的選擇
      if (selectedCells[teacherName]) {
        // 相容新舊格式
        const column = selectedCells[teacherName].column || selectedCells[teacherName];
        const cell = row.querySelector(`[data-column="${column}"]`);
        if (cell) {
          cell.classList.add('selected');
        }
      }
    });
    
    // 清理不在當前表格中的數據
    cleanupStorage();
  } catch (error) {
    console.error('Error restoring selected cells:', error);
  }
}

// 更新統計資訊
function updateStatistics() {
  const adminContainer = document.getElementById('admin-container-work');
  if (!adminContainer) return;
  
  // 保留標題，清空其餘內容
  const title = adminContainer.querySelector('h1');
  if (title) {
    adminContainer.innerHTML = '';
    adminContainer.appendChild(title);
  } else {
    adminContainer.innerHTML = '';
  }
  
  // 取得所有被選中的格子
  const selectedCells = document.querySelectorAll('.choice.selected');
  
  // 創建一個物件來統計每個選擇出現的次數
  const choiceCount = {};
  const teacherChoices = {};
  
  // 計算每個選擇的出現次數
  selectedCells.forEach(cell => {
    const choiceText = cell.textContent.trim();
    const teacherName = cell.getAttribute('data-teacher');
    
    if (choiceText) {
      // 增加選擇計數
      choiceCount[choiceText] = (choiceCount[choiceText] || 0) + 1;
      
      // 記錄哪些教師選擇了這個選項
      if (!teacherChoices[choiceText]) {
        teacherChoices[choiceText] = [];
      }
      teacherChoices[choiceText].push(teacherName);
    }
  });
  
  // 首先確保admin-container-work有正確的樣式設置
  adminContainer.style.display = 'flex';
  adminContainer.style.flexDirection = 'column';
  adminContainer.style.height = '100%';
  adminContainer.style.overflow = 'hidden'; // 防止整體容器溢出
  adminContainer.style.position = 'relative'; // 添加相對定位
  
  // 添加卡片容器並設置溢出控制
  const cardContainer = document.createElement('div');
  cardContainer.className = 'statistics-cards';
  cardContainer.style.display = 'flex';
  cardContainer.style.flexWrap = 'wrap';
  cardContainer.style.gap = '15px';
  cardContainer.style.flex = '1'; // 讓容器填充剩餘空間
  cardContainer.style.overflowY = 'auto'; // 垂直方向可滾動
  cardContainer.style.overflowX = 'hidden'; // 防止水平滾動
  cardContainer.style.padding = '10px'; // 添加內邊距
  cardContainer.style.boxSizing = 'border-box'; // 確保padding不會增加元素大小
  cardContainer.style.width = '100%'; // 確保容器寬度填滿父元素
  adminContainer.appendChild(cardContainer);
  
  // 為每個選擇創建一個卡片
  for (const choice in choiceCount) {
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.style.padding = '15px';
    card.style.borderRadius = '8px';
    card.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
    card.style.backgroundColor = '#f9f9f9';
    card.style.minWidth = '200px';
    card.style.maxWidth = '300px'; // 限制最大寬度
    card.style.flexGrow = '1'; // 允許卡片在空間足夠時擴展
    card.style.flexBasis = '200px'; // 基本寬度
    card.style.marginBottom = '15px'; // 底部間距
    
    const header = document.createElement('h3');
    header.textContent = choice;
    header.style.marginTop = '0';
    card.appendChild(header);
    
    const count = document.createElement('p');
    count.textContent = `數量: ${choiceCount[choice]}`;
    count.style.fontWeight = 'bold';
    card.appendChild(count);
    
    const teacherList = document.createElement('div');
    teacherList.style.marginTop = '10px';
    teacherList.style.maxHeight = '150px'; // 限制教師列表高度
    teacherList.style.overflowY = 'auto'; // 如果老師太多，添加垂直滾動
    
    // 加入教師名單
    const teachersTitle = document.createElement('p');
    teachersTitle.textContent = '選擇教師：';
    teachersTitle.style.marginBottom = '5px';
    teacherList.appendChild(teachersTitle);
    
    const teacherTagContainer = document.createElement('div');
    teacherTagContainer.style.display = 'flex';
    teacherTagContainer.style.flexWrap = 'wrap';
    teacherTagContainer.style.gap = '4px';
    
    teacherChoices[choice].forEach(teacher => {
      const teacherItem = document.createElement('div');
      teacherItem.textContent = teacher;
      teacherItem.style.padding = '3px 8px';
      teacherItem.style.backgroundColor = '#e9e9e9';
      teacherItem.style.borderRadius = '4px';
      teacherItem.style.display = 'inline-block';
      teacherTagContainer.appendChild(teacherItem);
    });
    
    teacherList.appendChild(teacherTagContainer);
    card.appendChild(teacherList);
    cardContainer.appendChild(card);
  }
  
  // 如果沒有選擇，顯示提示訊息
  if (Object.keys(choiceCount).length === 0) {
    const noData = document.createElement('p');
    noData.textContent = '尚未有選擇資料';
    noData.style.padding = '20px';
    noData.style.textAlign = 'center';
    cardContainer.appendChild(noData);
  } else if (Object.keys(choiceCount).length > 10) {
    // 如果卡片數量超過10個，添加一個提示訊息
    const scrollHint = document.createElement('div');
    scrollHint.textContent = '滑動查看更多選項';
    scrollHint.style.textAlign = 'center';
    scrollHint.style.padding = '10px';
    scrollHint.style.fontStyle = 'italic';
    scrollHint.style.color = '#666';
    scrollHint.style.width = '100%';
    scrollHint.style.position = 'sticky';
    scrollHint.style.bottom = '0';
    scrollHint.style.backgroundColor = 'rgba(255,255,255,0.8)';
    cardContainer.appendChild(scrollHint);
  }
  
  // 添加響應式調整
  window.addEventListener('resize', adjustCardLayout);
  adjustCardLayout();
}

// 調整卡片布局的輔助函數
function adjustCardLayout() {
  const cardContainer = document.querySelector('.statistics-cards');
  if (!cardContainer) return;
  
  const containerWidth = cardContainer.offsetWidth;
  const cards = cardContainer.querySelectorAll('.stat-card');
  
  // 根據容器寬度調整卡片布局
  if (containerWidth < 600) {
    // 小螢幕時，卡片占據更多寬度
    cards.forEach(card => {
      card.style.flexBasis = '100%';
      card.style.maxWidth = '100%';
    });
  } else {
    // 較大螢幕，多卡片並排
    cards.forEach(card => {
      card.style.flexBasis = '200px';
      card.style.maxWidth = '300px';
    });
  }
}

function logout() {
    window.location.href = 'index.html';
}

// 問題框相關JavaScript功能
function askAI() {
  const query = document.getElementById("question-input").value.trim();
  // 取得問題輸入框的值
  if (!query) {
    alert("請輸入問題！");
    return;
  }
  
  // 顯示載入中狀態
  document.getElementById("loading").style.display = "inline-flex";
  document.getElementById("submit-question").disabled = true;
  
  // 清空上次回應，如果有的話
  const aiResponseElement = document.getElementById("ai-response");
  aiResponseElement.textContent = "";
  
  // 確保回應區域已經顯示出來
  aiResponseElement.style.display = "block";

  // API URL 和參數 (使用您的 Apps Script 部署 URL)
  const url = "https://script.google.com/macros/s/AKfycbxl4muxmGpDLPvOuXQaCRYfgJK9Hc20QZJtDRu5ia_5tX7WoCoZhvQSIFrYSpRehdNqNg/exec";
  const params = {
    action: "askAI",
    query: query  // 傳送 query 作為參數
  };

  // 使用 URLSearchParams 格式化參數
  const urlWithParams = `${url}?${new URLSearchParams(params).toString()}`;

  // 發送 GET 請求
  fetch(urlWithParams)
    .then(response => response.text())
    .then(data => {
      // 隱藏載入中狀態
      document.getElementById("loading").style.display = "none";
      document.getElementById("submit-question").disabled = false;
      
      // 顯示回應結果並添加動畫效果
      aiResponseElement.innerHTML = data;  // 使用innerHTML以支持格式化文本
      aiResponseElement.classList.add('active');
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById("loading").style.display = "none";
      document.getElementById("submit-question").disabled = false;
      
      // 顯示友好的錯誤訊息在回應區域
      aiResponseElement.innerHTML = `<p class="error-message">發生錯誤，請稍後再試。</p>`;
      aiResponseElement.classList.add('active');
    });
}

// 監聽Enter鍵提交問題（可選功能）
document.getElementById('question-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && e.ctrlKey) {
    e.preventDefault();
    askAI();
  }
});

// 當頁面載入時，確保回應區域初始隱藏
document.addEventListener('DOMContentLoaded', function() {
  const aiResponseElement = document.getElementById("ai-response");
  if (aiResponseElement.textContent.trim() === '') {
    aiResponseElement.style.display = 'none';
  }
});
