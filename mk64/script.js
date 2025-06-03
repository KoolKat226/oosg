/*** CONSTANTS ***/
const CALENDAR = document.getElementById("calendar");
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const CURRENT_DATE = new Date();

let selectedMonth = CURRENT_DATE.getMonth();
let availableMonths = [CURRENT_DATE.getMonth()];

let EXAMPLE_TASKS = {
    0: {color: "#d11141", label: "Wake up at 7:00"},
    1: {color: "#00b159", label: "Make bed"},
    2: {color: "#00aedb", label: "Dinner before 23:00"},
    3: {color: "#f37735", label: "Practice Ukulele"},
    4: {color: "#ffc425", label: "Go exercise"}
}

function init() {
    checkLocalStorage();
    createDateInfo();
    createCalendarStructure();
    createInfoStructure();
}

var checkLocalStorage = () => {
    if(window.localStorage.currentMonth === undefined || window.localStorage.data === undefined) {
        localStorage.setItem("currentMonth", CURRENT_DATE.getMonth());
        let currentData = {[CURRENT_DATE.getMonth()]: {tasks: EXAMPLE_TASKS, data: {}}};
        localStorage.setItem("data", JSON.stringify(currentData));
    } else if(window.localStorage.currentMonth !== undefined && window.localStorage.currentMonth != CURRENT_DATE.getMonth()) {
        let previousData = JSON.parse(window.localStorage.data);

        if(getCurrentLocalStorageData() === undefined) {
            let confirmLoadPrevious = confirm("Do you want to load your previous habits?");

            let tasks = {};

            if(confirmLoadPrevious && previousData[getPreviousMonth()] !== undefined)
                tasks = previousData[getPreviousMonth()].tasks;

            localStorage.setItem("currentMonth", CURRENT_DATE.getMonth());
            let currentData = {...previousData, [CURRENT_DATE.getMonth()]: {tasks: tasks, data: {}}};

            localStorage.setItem("data", JSON.stringify(currentData));

        }
    }
    availableMonths = Object.keys(JSON.parse(window.localStorage.data));
}

var changeMonth = (month) => {
    selectedMonth = month;
    document.getElementById("monthLabel").innerText = MONTH_NAMES[selectedMonth];
    checkMonthsAvailability();
    updateTasks();
    setCalendarData();
}

var updateTasks = () => {
    let inputs = document.querySelectorAll("#taskLabels input[type='text']");

    inputs.forEach((task, i) => {
        colorSquareChanged(i);
        taskNameChanged(i);
    })
}

var setCalendarData = () => {
    let days = document.querySelectorAll("#calendar .dayContainer");
    const startDay = getMonthDayStart();
    const monthDays = getDaysFromCurrentMonth();
    let currentData = getCurrentLocalStorageData().data;

    days.forEach((day, i) => {
        let daySquare = day.children;
        let dayNumber = i - startDay;
        if(i < startDay || dayNumber >= monthDays) {
            if(i < startDay) day.classList.add("emptyDay");
            
            for(let square = 0; square < daySquare.length; square++) {
                daySquare[square].classList.add("hidden");
            };
            
        } else if(dayNumber < monthDays) {
            day.classList.remove("emptyDay");
            for(let j = 0; j < daySquare.length; j++) {
                daySquare[j].onclick = () => {toggleTaskActive(dayNumber, j, daySquare[j])};

                daySquare[j].classList.remove("hidden");
                daySquare[4].firstElementChild.innerText = j === 4 ? (dayNumber < 9 ? `0${dayNumber + 1}` : dayNumber + 1) : "";
                setColorTaskBackground(daySquare[j], j, currentData[dayNumber][j]);
            }
        }
    }) 
}

var createCalendarStructure = () => {
    const days = getDaysFromCurrentMonth();
    const startDay = getMonthDayStart();
    let currentData = getCurrentLocalStorageData().data;

    for(let i = 0; i < 35; i++) {
        let dayContainer = document.createElement("div");
        dayContainer.className = "dayContainer";

        let dayNumber = i - startDay;
        let dayIsPositive = i >= startDay;
        if(currentData[dayNumber] === undefined && dayIsPositive)
            currentData[dayNumber] = {};

        for(let j = 0; j < 5; j++) {
            if(dayIsPositive && (Object.keys(currentData[dayNumber]).length < 5)) {
                currentData[dayNumber][j] = false;
            }

            let task = document.createElement("div");
            let day = document.createElement("div");

            task.className = j !== 4 ? "square" : "circle";
            day.className = "day";

            if(i >= startDay && dayNumber < days) {
                day.innerText = task.className === "circle" ? (dayNumber < 9 ? `0${dayNumber + 1}` : dayNumber + 1) : "";
                setColorTaskBackground(task, j, currentData[dayNumber][j]);
                task.onclick = () => {toggleTaskActive(dayNumber, j, task)};
            } else {
                if(i < startDay) dayContainer.classList.add("emptyDay");
                task.classList.add("hidden");
            }
            
            task.appendChild(day);
            dayContainer.appendChild(task);
        }

        let thisMonthData = {[CURRENT_DATE.getMonth()]: {tasks: getCurrentLocalStorageData().tasks, data: currentData}};
        let data = {...JSON.parse(window.localStorage.data), ...thisMonthData};
        localStorage.setItem("data", JSON.stringify(data));

        CALENDAR.appendChild(dayContainer);
    }
}

var createDateInfo = () => {
    checkMonthsAvailability();

    DAY_NAMES.forEach(day => {
        let dayLabel = document.createElement("span");
        dayLabel.textContent = day;
        document.getElementById("daysLabels").appendChild(dayLabel);
    });
    document.getElementById("monthLabel").innerText = MONTH_NAMES[selectedMonth];
}

var createInfoStructure = () => {    
    let loadedTasks = getCurrentLocalStorageData().tasks;

    for(let i = 0; i < 5; i++) {
        let label = document.createElement("li");
        let input = document.createElement("input");
        let labelSquare = document.createElement("input");
        input.type = "text";
        labelSquare.type = "color";
        labelSquare.className = "squareLabel";


        let task = document.createElement("div");
        let day = document.createElement("div");

        task.className = i !== 4 ? "square" : "circle";
        day.className = "day";
        
        if(loadedTasks[i] !== undefined) {
            input.value = loadedTasks[i].label;
            labelSquare.style.background = loadedTasks[i].color;
            labelSquare.value = rgbToHex(loadedTasks[i].color)
            task.style.background = loadedTasks[i].color;
        } else {
            input.value = EXAMPLE_TASKS[i].label;
            labelSquare.value = rgbToHex(EXAMPLE_TASKS[i].color)
            labelSquare.style.background = EXAMPLE_TASKS[i].color;
            task.style.background = EXAMPLE_TASKS[i].color;
        }

        input.onchange = (inputData) => {taskNameChanged(i, inputData)};
        labelSquare.onchange = (inputColor) => {colorSquareChanged(i, inputColor)};
        task.onclick = () => {labelSquare.click();}

        label.appendChild(labelSquare);
        label.appendChild(input);
        document.getElementById("taskLabels").appendChild(label);

        task.appendChild(day);
        document.getElementById("taskExample").appendChild(task);
    }
}

var colorSquareChanged = (task, inputColor) => {
    let current = getCurrentLocalStorageData();
    let currentTasks = current.tasks;
    let value = inputColor === undefined ? currentTasks[task].color : inputColor.target.value;
    let currentItem = document.querySelectorAll("#taskLabels input[type='color']")[task];

    value = rgbToHex(value);
    currentItem.value = value;
    currentItem.style.background = value;
    document.getElementById("taskExample").children[task].style.background = value;

    currentTasks = {...currentTasks, [task]: {color: value, label: document.querySelectorAll("#taskLabels input[type='text']")[task].value}};

    let thisMonthData = {[selectedMonth]: {tasks: currentTasks, data: current.data}};
    let data = {...JSON.parse(window.localStorage.data), ...thisMonthData};
    localStorage.setItem("data", JSON.stringify(data));

    let allTasks = document.querySelectorAll("#calendar .dayContainer:not(.emptyDay)");
    current = getCurrentLocalStorageData();

    allTasks.forEach((square, task) => {
        let children = square.children;
        for(let i = 0; i < 5; i++) {
            if(current.tasks[i] !== undefined && current.data[task] !== undefined && current.data[task][i])
                children[i].style.background = current.tasks[i].color;
        }
    })

}

var taskNameChanged = (task, inputData) => {
    let current = getCurrentLocalStorageData();
    let currentTasks = current.tasks;

    let value = inputData === undefined ? currentTasks[task].label : inputData.target.value;
    let colorContainers = getTaskSquares();

    currentTasks = {...currentTasks, [task]: {color: colorContainers[task].style.background, label: value}};

    document.querySelectorAll("#taskLabels input[type='text']")[task].value = value;
    let thisMonthData = {[selectedMonth]: {tasks: currentTasks, data: current.data}};
    let data = {...JSON.parse(window.localStorage.data), ...thisMonthData};
    localStorage.setItem("data", JSON.stringify(data));
}

var getTaskStatus = (day, task) => {
    let currentData = getCurrentLocalStorageData().data;
    return currentData[day][task];
}

var setTaskStatus = (day, task, status) => {
    let currentData = getCurrentLocalStorageData().data;
    currentData[day][task] = status;

    let thisMonthData = {[selectedMonth]: {tasks: getCurrentLocalStorageData().tasks, data: currentData}};
    let data = {...JSON.parse(window.localStorage.data), ...thisMonthData};
    localStorage.setItem("data", JSON.stringify(data));
}

var setColorTaskBackground = (element, task, completed) => {
    let currentTasks = getCurrentLocalStorageData().tasks;

    if(currentTasks[task] !== undefined)
        element.style.background = completed ? currentTasks[task].color : "";
    else
        element.style.background = completed ? EXAMPLE_TASKS[task].color : "";
}

var toggleTaskActive = (day, task, element) => {
    let completed = getTaskStatus(day, task);

    setTaskStatus(day, task, !completed);
    setColorTaskBackground(element, task, !completed);
}

var checkMonthsAvailability = () => {
    let nextMonth = document.getElementById("nextMonth");
    let previousMonth = document.getElementById("previousMonth");

    if(!availableMonths.includes(String(getNextMonth())))
        nextMonth.classList.add("hidden");
    else
        nextMonth.classList.remove("hidden");

    if(!availableMonths.includes(String(getPreviousMonth())))
        previousMonth.classList.add("hidden");
    else
        previousMonth.classList.remove("hidden");
}

/*** UTILS ***/
var getDaysFromCurrentMonth = () => new Date(CURRENT_DATE.getFullYear(), selectedMonth + 1, 0).getDate();
var getMonthDayStart = () => {
    let startDay = new Date(CURRENT_DATE.getFullYear(), selectedMonth, 1).getDay();
    return startDay === 0 ? 6 : (startDay - 1);
}

var getCurrentLocalStorageData = () => JSON.parse(window.localStorage.data)[selectedMonth];

var getTaskSquares = () => document.querySelectorAll("#taskLabels > li input[type='color']");

var getPreviousMonth = () => {
    let month = selectedMonth - 1;
    return month < 0 ? 11 : month;
}

var getNextMonth = () => {
    let month = selectedMonth + 1;
    return month > 11 ? 0 : month;
}

var rgbToHex = (rgb) => {
    if(rgb.includes("#")) return rgb;
    rgb = rgb.replace(/(rgb)|\(|\)/g, '')
                           .split(',')
                           .map(val => Number(val));
    return rgb.reduce((acc,val) => acc + (0 + val.toString(16)).slice(-2), '#');
}

document.getElementById("nextMonth").onclick = () => {changeMonth(getNextMonth())};
document.getElementById("previousMonth").onclick = () => {changeMonth(getPreviousMonth())};

init();