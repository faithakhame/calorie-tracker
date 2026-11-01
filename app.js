/**
 * NutriLog - Pure Vanilla JavaScript Calorie & Macro Tracker
 * Persistent client-side data storage using localStorage
 */

(function () {
  'use strict';

  // --- STORAGE KEYS ---
  const STORAGE_KEYS = {
    LOGS: 'nutrilog_entries_v1',
    SETTINGS: 'nutrilog_settings_v1',
    CUSTOM_FOODS: 'nutrilog_custom_foods_v1'
  };

  // --- DEFAULT SETTINGS ---
  const DEFAULT_SETTINGS = {
    calorieGoal: 2000,
    proteinGoal: 150,
    carbsGoal: 200,
    fatGoal: 65,
    waterGoal: 8 // glasses (250ml each = 2000ml)
  };

  // --- BUILT-IN FOOD PRESETS LIBRARY ---
  const BUILTIN_FOODS = [
    { name: 'Oatmeal (Cooked)', serving: '1 cup (234g)', calories: 158, protein: 6, carbs: 27, fat: 3.2 },
    { name: 'Boiled Egg (Large)', serving: '1 egg (50g)', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3 },
    { name: 'Scrambled Eggs (2 Eggs)', serving: '2 large eggs', calories: 182, protein: 12.2, carbs: 2.1, fat: 14.0 },
    { name: 'Whole Milk', serving: '1 glass (240ml)', calories: 149, protein: 7.7, carbs: 11.7, fat: 8.0 },
    { name: 'Greek Yogurt (Plain, Non-fat)', serving: '1 container (170g)', calories: 100, protein: 17.3, carbs: 6.1, fat: 0.7 },
    { name: 'Banana', serving: '1 medium (118g)', calories: 105, protein: 1.3, carbs: 27.0, fat: 0.3 },
    { name: 'Apple', serving: '1 medium (182g)', calories: 95, protein: 0.5, carbs: 25.1, fat: 0.3 },
    { name: 'Grilled Chicken Breast', serving: '150g', calories: 248, protein: 46.5, carbs: 0, fat: 5.4 },
    { name: 'White Rice (Cooked)', serving: '1 cup (158g)', calories: 206, protein: 4.3, carbs: 44.5, fat: 0.4 },
    { name: 'Brown Rice (Cooked)', serving: '1 cup (195g)', calories: 218, protein: 4.5, carbs: 45.8, fat: 1.6 },
    { name: 'Grilled Salmon Fillet', serving: '150g', calories: 312, protein: 34.2, carbs: 0, fat: 18.5 },
    { name: 'Extra Virgin Olive Oil', serving: '1 tbsp (14ml)', calories: 119, protein: 0, carbs: 0, fat: 13.5 },
    { name: 'Peanut Butter', serving: '2 tbsp (32g)', calories: 188, protein: 8.0, carbs: 7.1, fat: 16.1 },
    { name: 'Whey Protein Shake', serving: '1 scoop (30g)', calories: 120, protein: 24.0, carbs: 3.0, fat: 1.5 },
    { name: 'Avocado', serving: '1/2 fruit (100g)', calories: 160, protein: 2.0, carbs: 8.5, fat: 14.7 },
    { name: 'Whole Wheat Bread', serving: '1 slice (32g)', calories: 82, protein: 4.0, carbs: 13.8, fat: 1.1 },
    { name: 'Steamed Broccoli', serving: '1 cup (91g)', calories: 31, protein: 2.6, carbs: 6.0, fat: 0.3 },
    { name: 'Raw Almonds', serving: 'Handful (28g)', calories: 164, protein: 6.0, carbs: 6.1, fat: 14.2 },
    { name: 'Pasta (Cooked)', serving: '1 cup (140g)', calories: 220, protein: 8.1, carbs: 43.2, fat: 1.3 },
    { name: 'Baked Sweet Potato', serving: '1 medium (114g)', calories: 103, protein: 2.3, carbs: 23.6, fat: 0.2 },
    { name: 'Garden Salad with Vinaigrette', serving: '1 bowl (150g)', calories: 85, protein: 1.8, carbs: 7.5, fat: 5.5 },
    { name: 'Protein Bar', serving: '1 bar (60g)', calories: 210, protein: 20.0, carbs: 22.0, fat: 7.0 },
    { name: 'Tuna in Water (Drained)', serving: '1 can (165g)', calories: 142, protein: 32.6, carbs: 0, fat: 1.0 },
    { name: 'Cheddar Cheese', serving: '1 slice (28g)', calories: 113, protein: 7.0, carbs: 0.4, fat: 9.3 }
  ];

  // --- STATE ---
  let currentDate = getTodayDateString();
  let settings = loadSettings();
  let logs = loadLogs();
  let customFoods = loadCustomFoods();
  let activeMealContext = 'breakfast';

  // --- DOM ELEMENTS ---
  const elements = {
    // Date
    datePickerTrigger: document.getElementById('date-picker-trigger'),
    dateDisplayLabel: document.getElementById('date-display-label'),
    dateInput: document.getElementById('date-input'),
    prevDayBtn: document.getElementById('prev-day-btn'),
    nextDayBtn: document.getElementById('next-day-btn'),
    todayBtn: document.getElementById('today-btn'),

    // Hero stats
    calorieRemainingVal: document.getElementById('calorie-remaining-val'),
    calorieGoalVal: document.getElementById('calorie-goal-val'),
    calorieConsumedVal: document.getElementById('calorie-consumed-val'),
    calorieBurnVal: document.getElementById('calorie-burn-val'),
    calorieStatusBadge: document.getElementById('calorie-status-badge'),
    calorieRingProgress: document.getElementById('calorie-ring-progress'),

    // Macros
    proteinConsumed: document.getElementById('protein-consumed'),
    proteinGoal: document.getElementById('protein-goal'),
    proteinProgressBar: document.getElementById('protein-progress-bar'),
    carbsConsumed: document.getElementById('carbs-consumed'),
    carbsGoal: document.getElementById('carbs-goal'),
    carbsProgressBar: document.getElementById('carbs-progress-bar'),
    fatConsumed: document.getElementById('fat-consumed'),
    fatGoal: document.getElementById('fat-goal'),
    fatProgressBar: document.getElementById('fat-progress-bar'),

    // Water
    waterGlassesCount: document.getElementById('water-glasses-count'),
    waterGoalCount: document.getElementById('water-goal-count'),
    waterMlCount: document.getElementById('water-ml-count'),
    waterGlassesContainer: document.getElementById('water-glasses-container'),
    waterMinusBtn: document.getElementById('water-minus-btn'),
    waterPlusBtn: document.getElementById('water-plus-btn'),

    // Chart
    weeklyChartCanvas: document.getElementById('weekly-chart'),
    chartTargetDisplay: document.getElementById('chart-target-display'),

    // Meals
    quickAddBtn: document.getElementById('quick-add-btn'),
    mealLists: {
      breakfast: document.getElementById('breakfast-items-list'),
      lunch: document.getElementById('lunch-items-list'),
      dinner: document.getElementById('dinner-items-list'),
      snacks: document.getElementById('snacks-items-list')
    },
    mealSummaries: {
      breakfast: document.getElementById('breakfast-macro-summary'),
      lunch: document.getElementById('lunch-macro-summary'),
      dinner: document.getElementById('dinner-macro-summary'),
      snacks: document.getElementById('snacks-macro-summary')
    },

    // Add Food Modal
    addFoodModal: document.getElementById('add-food-modal'),
    modalTitleText: document.getElementById('modal-title-text'),
    closeAddModalBtn: document.getElementById('close-add-modal-btn'),
    tabQuickSelectBtn: document.getElementById('tab-quick-select-btn'),
    tabCustomItemBtn: document.getElementById('tab-custom-item-btn'),
    tabLibraryContent: document.getElementById('tab-library-content'),
    tabCustomContent: document.getElementById('tab-custom-content'),
    foodSearchInput: document.getElementById('food-search-input'),
    libraryMealSelect: document.getElementById('library-meal-select'),
    libraryServingMultiplier: document.getElementById('library-serving-multiplier'),
    libraryItemsList: document.getElementById('library-items-list'),
    customFoodForm: document.getElementById('custom-food-form'),
    customMealSelect: document.getElementById('custom-meal-select'),
    customNameInput: document.getElementById('custom-name'),
    customServingInput: document.getElementById('custom-serving'),
    customCaloriesInput: document.getElementById('custom-calories'),
    customProteinInput: document.getElementById('custom-protein'),
    customCarbsInput: document.getElementById('custom-carbs'),
    customFatInput: document.getElementById('custom-fat'),
    customSaveLibrary: document.getElementById('custom-save-library'),
    cancelCustomBtn: document.getElementById('cancel-custom-btn'),

    // Goals Modal
    openGoalsModalBtn: document.getElementById('open-goals-modal-btn'),
    goalsModal: document.getElementById('goals-modal'),
    closeGoalsModalBtn: document.getElementById('close-goals-modal-btn'),
    cancelGoalsBtn: document.getElementById('cancel-goals-btn'),
    goalsForm: document.getElementById('goals-form'),
    goalCaloriesInput: document.getElementById('goal-calories-input'),
    goalProteinInput: document.getElementById('goal-protein-input'),
    goalCarbsInput: document.getElementById('goal-carbs-input'),
    goalFatInput: document.getElementById('goal-fat-input'),
    goalWaterInput: document.getElementById('goal-water-input'),

    // Data Modal
    openDataModalBtn: document.getElementById('open-data-modal-btn'),
    dataModal: document.getElementById('data-modal'),
    closeDataModalBtn: document.getElementById('close-data-modal-btn'),
    exportDataBtn: document.getElementById('export-data-btn'),
    importDataFile: document.getElementById('import-data-file'),
    clearDayBtn: document.getElementById('clear-day-btn'),
    resetAllBtn: document.getElementById('reset-all-btn'),

    // Toast
    toastContainer: document.getElementById('toast-container')
  };

  // --- STORAGE HELPERS ---
  function loadSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? Object.assign({}, DEFAULT_SETTINGS, JSON.parse(data)) : Object.assign({}, DEFAULT_SETTINGS);
    } catch (e) {
      console.error('Failed to parse settings:', e);
      return Object.assign({}, DEFAULT_SETTINGS);
    }
  }

  function saveSettings(newSettings) {
    settings = Object.assign({}, newSettings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  function loadLogs() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOGS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Failed to parse logs:', e);
      return {};
    }
  }

  function saveLogs() {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  }

  function loadCustomFoods() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_FOODS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse custom foods:', e);
      return [];
    }
  }

  function saveCustomFoods() {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_FOODS, JSON.stringify(customFoods));
  }

  // Ensure day entry exists
  function getDayData(dateStr) {
    if (!logs[dateStr]) {
      logs[dateStr] = {
        meals: {
          breakfast: [],
          lunch: [],
          dinner: [],
          snacks: []
        },
        water: 0
      };
    }
    return logs[dateStr];
  }

  // --- DATE HELPERS ---
  function getTodayDateString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatDisplayDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const todayStr = getTodayDateString();

    const yesterdayObj = new Date();
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yestStr = `${yesterdayObj.getFullYear()}-${String(yesterdayObj.getMonth() + 1).padStart(2, '0')}-${String(yesterdayObj.getDate()).padStart(2, '0')}`;

    const tomorrowObj = new Date();
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    const tomStr = `${tomorrowObj.getFullYear()}-${String(tomorrowObj.getMonth() + 1).padStart(2, '0')}-${String(tomorrowObj.getDate()).padStart(2, '0')}`;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedDate = `${monthNames[dateObj.getMonth()]} ${dateObj.getDate()}`;

    if (dateStr === todayStr) {
      return `Today, ${formattedDate}`;
    } else if (dateStr === yestStr) {
      return `Yesterday, ${formattedDate}`;
    } else if (dateStr === tomStr) {
      return `Tomorrow, ${formattedDate}`;
    } else {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return `${dayNames[dateObj.getDay()]}, ${formattedDate}`;
    }
  }

  function shiftDate(dateStr, offsetDays) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + offsetDays);
    const ny = date.getFullYear();
    const nm = String(date.getMonth() + 1).padStart(2, '0');
    const nd = String(date.getDate()).padStart(2, '0');
    return `${ny}-${nm}-${nd}`;
  }

  // --- TOAST NOTIFICATIONS ---
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 2400);
  }

  // --- RENDERING & UI UPDATES ---
  function updateDashboard() {
    const day = getDayData(currentDate);

    // Update Date Display
    elements.dateDisplayLabel.textContent = formatDisplayDate(currentDate);
    elements.dateInput.value = currentDate;

    // Calculate Totals
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];
    mealTypes.forEach(mealType => {
      const items = day.meals[mealType] || [];
      let mealCals = 0;
      let mealProt = 0;
      let mealCarb = 0;
      let mealFat = 0;

      items.forEach(item => {
        mealCals += Number(item.calories) || 0;
        mealProt += Number(item.protein) || 0;
        mealCarb += Number(item.carbs) || 0;
        mealFat += Number(item.fat) || 0;
      });

      totalCalories += mealCals;
      totalProtein += mealProt;
      totalCarbs += mealCarb;
      totalFat += mealFat;

      // Update meal subtotal header
      elements.mealSummaries[mealType].textContent = 
        `${Math.round(mealCals)} kcal • ${mealProt.toFixed(1)}g P • ${mealCarb.toFixed(1)}g C • ${mealFat.toFixed(1)}g F`;

      // Render meal list items
      renderMealItems(mealType, items);
    });

    // Update Calorie Summary Cards
    const goalCal = settings.calorieGoal;
    const remainingCal = goalCal - totalCalories;

    elements.calorieGoalVal.textContent = goalCal.toLocaleString();
    elements.calorieConsumedVal.textContent = Math.round(totalCalories).toLocaleString();
    elements.calorieBurnVal.textContent = Math.round(totalCalories * 0.1).toLocaleString(); // Estimated TEF/activity
    elements.chartTargetDisplay.textContent = goalCal.toLocaleString();

    if (remainingCal >= 0) {
      elements.calorieRemainingVal.textContent = Math.round(remainingCal).toLocaleString();
      elements.calorieRemainingVal.classList.remove('over-budget');
      elements.calorieStatusBadge.textContent = 'On Track';
      elements.calorieStatusBadge.classList.remove('exceeded');
      elements.calorieRingProgress.classList.remove('over-budget');
    } else {
      elements.calorieRemainingVal.textContent = Math.round(Math.abs(remainingCal)).toLocaleString();
      elements.calorieRemainingVal.classList.add('over-budget');
      elements.calorieStatusBadge.textContent = 'Over Budget';
      elements.calorieStatusBadge.classList.add('exceeded');
      elements.calorieRingProgress.classList.add('over-budget');
    }

    // Update Progress Ring (radius 68, circumference = 2 * PI * 68 ≈ 427.2566)
    const circumference = 2 * Math.PI * 68;
    const ratio = goalCal > 0 ? Math.min(totalCalories / goalCal, 1) : 0;
    const strokeOffset = circumference * (1 - ratio);
    elements.calorieRingProgress.style.strokeDasharray = `${circumference}`;
    elements.calorieRingProgress.style.strokeDashoffset = `${strokeOffset}`;

    // Update Macros
    updateMacroBar('protein', totalProtein, settings.proteinGoal, elements.proteinConsumed, elements.proteinGoal, elements.proteinProgressBar);
    updateMacroBar('carbs', totalCarbs, settings.carbsGoal, elements.carbsConsumed, elements.carbsGoal, elements.carbsProgressBar);
    updateMacroBar('fat', totalFat, settings.fatGoal, elements.fatConsumed, elements.fatGoal, elements.fatProgressBar);

    // Update Water Tracker
    renderWaterTracker(day.water || 0, settings.waterGoal || 8);

    // Render Weekly Canvas Chart
    renderWeeklyChart();
  }

  function updateMacroBar(name, consumed, goal, valEl, goalEl, barEl) {
    valEl.textContent = `${consumed.toFixed(1)}g`;
    goalEl.textContent = `${goal}g`;
    const pct = goal > 0 ? Math.min(Math.round((consumed / goal) * 100), 100) : 0;
    barEl.style.width = `${pct}%`;
  }

  function renderMealItems(mealType, items) {
    const container = elements.mealLists[mealType];
    container.innerHTML = '';

    if (!items || items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-meal-placeholder';
      empty.textContent = `No items logged for ${mealType} yet.`;
      container.appendChild(empty);
      return;
    }

    items.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'food-item-row';

      const left = document.createElement('div');
      left.className = 'food-item-left';

      const title = document.createElement('div');
      title.className = 'food-item-name';
      title.textContent = item.name;

      const serving = document.createElement('div');
      serving.className = 'food-item-serving';
      serving.textContent = item.serving || '1 serving';

      left.appendChild(title);
      left.appendChild(serving);

      const right = document.createElement('div');
      right.className = 'food-item-right';

      const macros = document.createElement('div');
      macros.className = 'food-item-macros';

      const calChip = document.createElement('span');
      calChip.className = 'macro-chip cal';
      calChip.textContent = `${Math.round(item.calories)} kcal`;

      const proChip = document.createElement('span');
      proChip.className = 'macro-chip pro';
      proChip.textContent = `${Number(item.protein).toFixed(1)}g P`;

      const carbChip = document.createElement('span');
      carbChip.className = 'macro-chip carb';
      carbChip.textContent = `${Number(item.carbs).toFixed(1)}g C`;

      const fatChip = document.createElement('span');
      fatChip.className = 'macro-chip fat';
      fatChip.textContent = `${Number(item.fat).toFixed(1)}g F`;

      macros.appendChild(calChip);
      macros.appendChild(proChip);
      macros.appendChild(carbChip);
      macros.appendChild(fatChip);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'food-item-delete-btn';
      deleteBtn.title = 'Remove item';
      deleteBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
      deleteBtn.addEventListener('click', () => {
        deleteFoodItem(mealType, index);
      });

      right.appendChild(macros);
      right.appendChild(deleteBtn);

      row.appendChild(left);
      row.appendChild(right);
      container.appendChild(row);
    });
  }

  function deleteFoodItem(mealType, index) {
    const day = getDayData(currentDate);
    const removed = day.meals[mealType].splice(index, 1);
    saveLogs();
    updateDashboard();
    if (removed && removed[0]) {
      showToast(`Removed "${removed[0].name}"`, 'info');
    }
  }

  // --- WATER TRACKER ---
  function renderWaterTracker(glasses, goal) {
    elements.waterGlassesCount.textContent = glasses;
    elements.waterGoalCount.textContent = goal;
    elements.waterMlCount.textContent = glasses * 250;

    elements.waterGlassesContainer.innerHTML = '';
    for (let i = 1; i <= goal; i++) {
      const glass = document.createElement('div');
      glass.className = `water-glass-icon ${i <= glasses ? 'filled' : ''}`;
      glass.title = `Glass ${i} (250ml)`;
      glass.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>';
      glass.addEventListener('click', () => {
        const day = getDayData(currentDate);
        day.water = i === day.water ? i - 1 : i;
        saveLogs();
        updateDashboard();
      });
      elements.waterGlassesContainer.appendChild(glass);
    }
  }

  function adjustWater(amount) {
    const day = getDayData(currentDate);
    const newCount = Math.max(0, Math.min(30, (day.water || 0) + amount));
    day.water = newCount;
    saveLogs();
    updateDashboard();
  }

  // --- 7-DAY WEEKLY CANVAS CHART ---
  function renderWeeklyChart() {
    const canvas = elements.weeklyChartCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 380;
    const height = 180;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Build array of past 7 days ending at currentDate
    const daysData = [];
    for (let i = 6; i >= 0; i--) {
      const dStr = shiftDate(currentDate, -i);
      const dayLog = logs[dStr];
      let dayCals = 0;
      if (dayLog && dayLog.meals) {
        ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(m => {
          (dayLog.meals[m] || []).forEach(item => {
            dayCals += Number(item.calories) || 0;
          });
        });
      }
      const [y, m, d] = dStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()];
      daysData.push({
        dateStr: dStr,
        dayLabel: dayShort,
        calories: Math.round(dayCals),
        isSelected: dStr === currentDate
      });
    }

    const padding = { top: 25, right: 15, bottom: 25, left: 15 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxCalorieVal = Math.max(...daysData.map(d => d.calories), settings.calorieGoal, 2000);
    const scaleY = chartH / (maxCalorieVal * 1.15);

    // Draw Target Line
    const targetY = padding.top + chartH - (settings.calorieGoal * scaleY);
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.moveTo(padding.left, targetY);
    ctx.lineTo(width - padding.right, targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw bars
    const barWidth = Math.min(32, (chartW / 7) - 10);
    const stepX = chartW / 7;

    daysData.forEach((day, idx) => {
      const x = padding.left + (idx * stepX) + (stepX - barWidth) / 2;
      const barHeight = Math.max(4, day.calories * scaleY);
      const y = padding.top + chartH - barHeight;

      // Color scheme
      let fillColor = '#cbd5e1';
      if (day.isSelected) {
        fillColor = day.calories > settings.calorieGoal ? '#ef4444' : '#10b981';
      } else if (day.calories > settings.calorieGoal) {
        fillColor = '#f87171';
      } else if (day.calories > 0) {
        fillColor = '#94a3b8';
      }

      // Draw rounded bar
      ctx.fillStyle = fillColor;
      drawRoundedRect(ctx, x, y, barWidth, barHeight, 5);

      // Calorie text above bar
      if (day.calories > 0) {
        ctx.fillStyle = day.isSelected ? '#0f172a' : '#64748b';
        ctx.font = '600 10px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(day.calories, x + barWidth / 2, y - 6);
      }

      // Day of week label below bar
      ctx.fillStyle = day.isSelected ? '#10b981' : '#64748b';
      ctx.font = day.isSelected ? '700 11px -apple-system, sans-serif' : '500 11px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(day.dayLabel, x + barWidth / 2, height - 8);
    });
  }

  function drawRoundedRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, 0);
    ctx.arcTo(x, y + h, x, y, 0);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  // --- ADD FOOD MODAL LOGIC ---
  function openAddFoodModal(mealType = 'breakfast') {
    activeMealContext = mealType;
    elements.libraryMealSelect.value = mealType;
    elements.customMealSelect.value = mealType;
    elements.modalTitleText.textContent = `Log Food to ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`;
    elements.foodSearchInput.value = '';
    elements.libraryServingMultiplier.value = 1;
    switchTab('library');
    renderLibraryFoods('');
    elements.addFoodModal.classList.add('active');
    setTimeout(() => {
      elements.foodSearchInput.focus();
    }, 50);
  }

  function closeAddFoodModal() {
    elements.addFoodModal.classList.remove('active');
    elements.customFoodForm.reset();
  }

  function switchTab(tab) {
    if (tab === 'library') {
      elements.tabQuickSelectBtn.classList.add('active');
      elements.tabCustomItemBtn.classList.remove('active');
      elements.tabLibraryContent.classList.remove('hidden');
      elements.tabCustomContent.classList.add('hidden');
    } else {
      elements.tabCustomItemBtn.classList.add('active');
      elements.tabQuickSelectBtn.classList.remove('active');
      elements.tabCustomContent.classList.remove('hidden');
      elements.tabLibraryContent.classList.add('hidden');
    }
  }

  function renderLibraryFoods(query = '') {
    const list = elements.libraryItemsList;
    list.innerHTML = '';
    const q = query.trim().toLowerCase();

    // Combine custom foods first, then builtins
    const allFoods = [
      ...customFoods.map(f => Object.assign({}, f, { isCustom: true })),
      ...BUILTIN_FOODS
    ];

    const filtered = allFoods.filter(f => f.name.toLowerCase().includes(q));

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-meal-placeholder';
      empty.textContent = 'No matching foods found. Switch to Custom Food tab to create it!';
      list.appendChild(empty);
      return;
    }

    filtered.forEach(food => {
      const card = document.createElement('div');
      card.className = 'library-item-card';

      const info = document.createElement('div');
      info.className = 'lib-item-info';

      const title = document.createElement('div');
      title.className = 'lib-item-title';
      title.textContent = food.name + (food.isCustom ? ' ⭐' : '');

      const sub = document.createElement('div');
      sub.className = 'lib-item-sub';
      sub.textContent = `${food.serving} • ${food.calories} kcal • ${food.protein}g P • ${food.carbs}g C • ${food.fat}g F`;

      info.appendChild(title);
      info.appendChild(sub);

      const addBtn = document.createElement('span');
      addBtn.className = 'lib-item-add-tag';
      addBtn.textContent = '+ Log';

      card.appendChild(info);
      card.appendChild(addBtn);

      card.addEventListener('click', () => {
        const mult = parseFloat(elements.libraryServingMultiplier.value) || 1;
        const targetMeal = elements.libraryMealSelect.value;
        const loggedItem = {
          name: food.name,
          serving: mult === 1 ? food.serving : `${mult}x (${food.serving})`,
          calories: Math.round(food.calories * mult),
          protein: Number((food.protein * mult).toFixed(1)),
          carbs: Number((food.carbs * mult).toFixed(1)),
          fat: Number((food.fat * mult).toFixed(1))
        };

        const day = getDayData(currentDate);
        day.meals[targetMeal].push(loggedItem);
        saveLogs();
        updateDashboard();
        closeAddFoodModal();
        showToast(`Logged "${loggedItem.name}" to ${targetMeal}!`);
      });

      list.appendChild(card);
    });
  }

  function handleCustomFoodSubmit(e) {
    e.preventDefault();
    const name = elements.customNameInput.value.trim();
    const meal = elements.customMealSelect.value;
    const serving = elements.customServingInput.value.trim() || '1 serving';
    const calories = parseFloat(elements.customCaloriesInput.value) || 0;
    const protein = parseFloat(elements.customProteinInput.value) || 0;
    const carbs = parseFloat(elements.customCarbsInput.value) || 0;
    const fat = parseFloat(elements.customFatInput.value) || 0;

    if (!name) return;

    const newItem = {
      name,
      serving,
      calories: Math.round(calories),
      protein: Number(protein.toFixed(1)),
      carbs: Number(carbs.toFixed(1)),
      fat: Number(fat.toFixed(1))
    };

    // Save to user custom library if checked
    if (elements.customSaveLibrary.checked) {
      const exists = customFoods.some(f => f.name.toLowerCase() === name.toLowerCase());
      if (!exists) {
        customFoods.unshift(newItem);
        saveCustomFoods();
      }
    }

    // Add to current log
    const day = getDayData(currentDate);
    day.meals[meal].push(newItem);
    saveLogs();
    updateDashboard();
    closeAddFoodModal();
    showToast(`Added "${name}" to ${meal}!`);
  }

  // --- GOALS MODAL LOGIC ---
  function openGoalsModal() {
    elements.goalCaloriesInput.value = settings.calorieGoal;
    elements.goalProteinInput.value = settings.proteinGoal;
    elements.goalCarbsInput.value = settings.carbsGoal;
    elements.goalFatInput.value = settings.fatGoal;
    elements.goalWaterInput.value = settings.waterGoal;
    elements.goalsModal.classList.add('active');
  }

  function closeGoalsModal() {
    elements.goalsModal.classList.remove('active');
  }

  function applyMacroPreset(pRatio, cRatio, fRatio) {
    const cals = parseFloat(elements.goalCaloriesInput.value) || 2000;
    // 4 kcal per gram protein & carb, 9 kcal per gram fat
    const proteinGrams = Math.round((cals * (pRatio / 100)) / 4);
    const carbsGrams = Math.round((cals * (cRatio / 100)) / 4);
    const fatGrams = Math.round((cals * (fRatio / 100)) / 9);

    elements.goalProteinInput.value = proteinGrams;
    elements.goalCarbsInput.value = carbsGrams;
    elements.goalFatInput.value = fatGrams;
  }

  function handleGoalsSubmit(e) {
    e.preventDefault();
    const newSettings = {
      calorieGoal: parseInt(elements.goalCaloriesInput.value, 10) || 2000,
      proteinGoal: parseInt(elements.goalProteinInput.value, 10) || 150,
      carbsGoal: parseInt(elements.goalCarbsInput.value, 10) || 200,
      fatGoal: parseInt(elements.goalFatInput.value, 10) || 65,
      waterGoal: parseInt(elements.goalWaterInput.value, 10) || 8
    };

    saveSettings(newSettings);
    updateDashboard();
    closeGoalsModal();
    showToast('Nutrition targets updated!');
  }

  // --- DATA MODAL LOGIC ---
  function openDataModal() {
    elements.dataModal.classList.add('active');
  }

  function closeDataModal() {
    elements.dataModal.classList.remove('active');
  }

  function exportData() {
    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: settings,
      logs: logs,
      customFoods: customFoods
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nutrilog-backup-${getTodayDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Backup JSON downloaded!');
  }

  function importData(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.settings) saveSettings(parsed.settings);
        if (parsed.logs) {
          logs = parsed.logs;
          saveLogs();
        }
        if (parsed.customFoods) {
          customFoods = parsed.customFoods;
          saveCustomFoods();
        }
        updateDashboard();
        closeDataModal();
        showToast('Data imported successfully!');
      } catch (err) {
        console.error('Failed to parse import:', err);
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function clearActiveDay() {
    if (confirm(`Are you sure you want to clear all meal entries and water for ${formatDisplayDate(currentDate)}?`)) {
      if (logs[currentDate]) {
        delete logs[currentDate];
        saveLogs();
        updateDashboard();
        closeDataModal();
        showToast(`Cleared logs for ${formatDisplayDate(currentDate)}`, 'info');
      }
    }
  }

  function resetAllData() {
    if (confirm('WARNING: This will permanently delete ALL recorded days, custom foods, and goal settings. Are you sure?')) {
      localStorage.removeItem(STORAGE_KEYS.LOGS);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_FOODS);
      logs = {};
      settings = Object.assign({}, DEFAULT_SETTINGS);
      customFoods = [];
      updateDashboard();
      closeDataModal();
      showToast('All data has been reset to defaults', 'danger');
    }
  }

  // --- INITIAL SAMPLE DATA (IF FIRST RUN) ---
  function initializeSampleDataIfEmpty() {
    if (Object.keys(logs).length === 0) {
      const today = getTodayDateString();
      logs[today] = {
        meals: {
          breakfast: [
            { name: 'Oatmeal (Cooked)', serving: '1 cup (234g)', calories: 158, protein: 6.0, carbs: 27.0, fat: 3.2 },
            { name: 'Banana', serving: '1 medium (118g)', calories: 105, protein: 1.3, carbs: 27.0, fat: 0.3 }
          ],
          lunch: [
            { name: 'Grilled Chicken Breast', serving: '150g', calories: 248, protein: 46.5, carbs: 0, fat: 5.4 },
            { name: 'White Rice (Cooked)', serving: '1 cup (158g)', calories: 206, protein: 4.3, carbs: 44.5, fat: 0.4 },
            { name: 'Steamed Broccoli', serving: '1 cup (91g)', calories: 31, protein: 2.6, carbs: 6.0, fat: 0.3 }
          ],
          dinner: [],
          snacks: [
            { name: 'Raw Almonds', serving: 'Handful (28g)', calories: 164, protein: 6.0, carbs: 6.1, fat: 14.2 }
          ]
        },
        water: 5
      };
      saveLogs();
    }
  }

  // --- EVENT LISTENERS SETUP ---
  function setupEventListeners() {
    // Date Navigation
    elements.prevDayBtn.addEventListener('click', () => {
      currentDate = shiftDate(currentDate, -1);
      updateDashboard();
    });

    elements.nextDayBtn.addEventListener('click', () => {
      currentDate = shiftDate(currentDate, 1);
      updateDashboard();
    });

    elements.todayBtn.addEventListener('click', () => {
      currentDate = getTodayDateString();
      updateDashboard();
    });

    elements.datePickerTrigger.addEventListener('click', () => {
      try {
        elements.dateInput.showPicker();
      } catch (e) {
        elements.dateInput.focus();
      }
    });

    elements.dateInput.addEventListener('change', (e) => {
      if (e.target.value) {
        currentDate = e.target.value;
        updateDashboard();
      }
    });

    // Water Controls
    elements.waterPlusBtn.addEventListener('click', () => adjustWater(1));
    elements.waterMinusBtn.addEventListener('click', () => adjustWater(-1));

    // Meal Card Add Buttons
    document.querySelectorAll('.add-meal-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mealType = btn.getAttribute('data-meal');
        openAddFoodModal(mealType);
      });
    });

    elements.quickAddBtn.addEventListener('click', () => {
      openAddFoodModal('breakfast');
    });

    // Add Food Modal Controls
    elements.closeAddModalBtn.addEventListener('click', closeAddFoodModal);
    elements.cancelCustomBtn.addEventListener('click', closeAddFoodModal);
    elements.tabQuickSelectBtn.addEventListener('click', () => switchTab('library'));
    elements.tabCustomItemBtn.addEventListener('click', () => switchTab('custom'));
    elements.foodSearchInput.addEventListener('input', (e) => renderLibraryFoods(e.target.value));
    elements.customFoodForm.addEventListener('submit', handleCustomFoodSubmit);

    // Goals Modal Controls
    elements.openGoalsModalBtn.addEventListener('click', openGoalsModal);
    elements.closeGoalsModalBtn.addEventListener('click', closeGoalsModal);
    elements.cancelGoalsBtn.addEventListener('click', closeGoalsModal);
    elements.goalsForm.addEventListener('submit', handleGoalsSubmit);

    document.querySelectorAll('.preset-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = parseFloat(btn.getAttribute('data-p'));
        const c = parseFloat(btn.getAttribute('data-c'));
        const f = parseFloat(btn.getAttribute('data-f'));
        applyMacroPreset(p, c, f);
      });
    });

    // Data Modal Controls
    elements.openDataModalBtn.addEventListener('click', openDataModal);
    elements.closeDataModalBtn.addEventListener('click', closeDataModal);
    elements.exportDataBtn.addEventListener('click', exportData);
    elements.importDataFile.addEventListener('change', importData);
    elements.clearDayBtn.addEventListener('click', clearActiveDay);
    elements.resetAllBtn.addEventListener('click', resetAllData);

    // Close modals on overlay backdrop click
    [elements.addFoodModal, elements.goalsModal, elements.dataModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });

    // Window resize redraws canvas
    window.addEventListener('resize', () => {
      renderWeeklyChart();
    });
  }

  // --- INITIALIZE APPLICATION ---
  function init() {
    initializeSampleDataIfEmpty();
    setupEventListeners();
    updateDashboard();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

