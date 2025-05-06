const tableBody = document.querySelector('#teacher-table tbody');
document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById('loading-spinner');
  
  const baseUrl = 'https://script.google.com/macros/s/AKfycbzVVWL9jrZ7fO9ZVeNVpE0B-dB0UBH0HVngN8fLNZKcalGPmhlSgJwVmi8aL34_HDey1w/exec';
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
      // 分類教師：科任與非科任
      const subjectTeachers = [];
      const nonSubjectTeachers = [];
      teacherData.forEach(teacher => {
        if (teacher.firstChoice.includes('科任')) {
          subjectTeachers.push(teacher);
        } else {
          nonSubjectTeachers.push(teacher);
        }
      });
      // 根據分數進行排序，從高到低
      subjectTeachers.sort((a, b) => b.score - a.score);
      nonSubjectTeachers.sort((a, b) => b.score - a.score);
      // 合併排序後的教師數據，非科任在前，科任在後
      const sortedTeachers = [...nonSubjectTeachers, ...subjectTeachers];
      // 清空表格並重新渲染
      tableBody.innerHTML = '';
      // 顯示排名
      sortedTeachers.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${row.teacherName ?? ''}</td>
          <td>${row.score ?? 0}</td>
          <td class="choice" data-column="firstChoice" data-teacher="${row.teacherName}">${row.firstChoice ?? ''}</td>
          <td class="choice" data-column="secondChoice" data-teacher="${row.teacherName}">${row.secondChoice ?? ''}</td>
          <td class="choice" data-column="thirdChoice" data-teacher="${row.teacherName}">${row.thirdChoice ?? ''}</td>
        `;
        tableBody.appendChild(tr);
      });
      // 從 localStorage 恢復上次選擇的格子
      restoreSelectedCells();
      
      // 更新統計
      updateStatistics();
      
      // 為每個表格的選擇欄位添加點擊事件
      tableBody.addEventListener('click', (e) => {
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
  const row = tableBody.rows[rowIndex];
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
  const row = tableBody.rows[rowIndex];
  const teacherName = row.cells[0].textContent.trim();
  
  delete selectedCells[teacherName];
  localStorage.setItem('selectedCells', JSON.stringify(selectedCells));
}

// 清理未使用的存儲數據
function cleanupStorage() {
  const selectedCells = JSON.parse(localStorage.getItem('selectedCells') || '{}');
  const currentTeachers = [];
  
  // 獲取當前表格中所有教師名稱
  Array.from(tableBody.rows).forEach(row => {
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

// 恢復選擇的格子
function restoreSelectedCells() {
  const selectedCells = JSON.parse(localStorage.getItem('selectedCells') || '{}');
  
  // 遍歷表格所有行
  Array.from(tableBody.rows).forEach(row => {
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
}

// 更新統計資訊
function updateStatistics() {
  const adminContainer = document.getElementById('admin-container-work');
  if (!adminContainer) return;
  
  // 保留標題，清空其餘內容
  const title = adminContainer.querySelector('h1');
  adminContainer.innerHTML = '';
  adminContainer.appendChild(title);
  
  // 取得所有被選中的格子
  const selectedCells = document.querySelectorAll('.choice.selected');
  
  // 創建一個物件來統計每個選擇出現的次數
  const choiceCount = {};
  const teacherChoices = {};
  
  // 計算每個選擇的出現次數
  selectedCells.forEach(cell => {
    const choiceText = cell.textContent.trim();
    const teacherName = cell.dataset.teacher;
    
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
  
  // 添加卡片容器
  const cardContainer = document.createElement('div');
  cardContainer.className = 'statistics-cards';
  cardContainer.style.display = 'flex';
  cardContainer.style.flexWrap = 'wrap';
  cardContainer.style.gap = '15px';
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
    
    // 加入教師名單
    const teachersTitle = document.createElement('p');
    teachersTitle.textContent = '選擇教師：';
    teachersTitle.style.marginBottom = '5px';
    teacherList.appendChild(teachersTitle);
    
    teacherChoices[choice].forEach(teacher => {
      const teacherItem = document.createElement('div');
      teacherItem.textContent = teacher;
      teacherItem.style.padding = '3px 8px';
      teacherItem.style.margin = '2px';
      teacherItem.style.backgroundColor = '#e9e9e9';
      teacherItem.style.borderRadius = '4px';
      teacherItem.style.display = 'inline-block';
      teacherList.appendChild(teacherItem);
    });
    
    card.appendChild(teacherList);
    cardContainer.appendChild(card);
  }
  
  // 如果沒有選擇，顯示提示訊息
  if (Object.keys(choiceCount).length === 0) {
    const noData = document.createElement('p');
    noData.textContent = '尚未有選擇資料';
    noData.style.padding = '20px';
    noData.style.textAlign = 'center';
    adminContainer.appendChild(noData);
  }
}

function logout() {
    window.location.href = 'index.html';
}
