let footer; // Footer element 
let windowIndex = 0; // Generated window index
const windowsInfo = []; // selector (for sliding), open

// slideToggle control for displayed windows ensuring only one is shown at a time
// Faster sliding transition when closing other windows than opening window
function windowControl(index) {
    const windowInfo = windowsInfo[index];
    if(windowInfo.open === true) { // Window currently open, close it
        windowInfo.open = !windowInfo.open; // open -> closed
        windowInfo.selector.slideToggle(400);
    } else { // Window currently closed
        // Close other windows currently open (should beonly one)
        for(const otherWindowInfo of windowsInfo) {
            if(otherWindowInfo.open) {
                otherWindowInfo.open = !otherWindowInfo.open; // open -> closed
                otherWindowInfo.selector.slideToggle(200);
            }
        }

        windowInfo.open = !windowInfo.open; // closed -> open
        windowInfo.selector.slideToggle(400);

        return;
    }
}

// Generates red-orange window header with text
// @param {string} text
// @returns {DOMElement} the header element
function generateWindowHeader(text) {
    // Generate header wrapper element
    const header = document.createElement("div");
    header.classList.add("akito-header");

    // Generate div containing actual text
    const headerText = document.createElement("p");
    headerText.classList.add("akito-headerTitle");
    header.appendChild(headerText);
    headerText.innerText = text;

    return header;
}

// Generates and adds footer icon and window (todo: add compatibility mode for Best Buy...)
// Window is added to slide controller, and global icon and window offset are incremented per initialization.
// @param {string} iconURL
// @param {string} title
// @param {number} width
// @param {number} height
// @param {boolean} compatibility
// @returns {DOMElement} 
// @returns {DOMElement}
function generateWindow(iconURL, title, width, height, compatibility = false) {
    // Check whether footer has even been initialized
    if(footer === undefined) {
        throw 'Footer has not been initialized yet!';
    }

    // Increment all flexbox orders in advance
    const placeIndex = footer.children.length - 2;
    for(const element of footer.children) {
        if(element.tagName !== "a") { // script info or donation
            element.style.order++;
        }
    }

    // Initialize a element for window toggle and add to footer
    const iconClick = document.createElement("a");
    const index = windowIndex++; // Copy constant for onclick
    iconClick.classList.add("akito-iconClick");
    iconClick.classList.add(`akito-icon${placeIndex}`);
    footer.insertBefore(iconClick, footer.children[footer.children.length - 2]); // doesn't matter because order
    iconClick.href = "#";
    iconClick.onclick = function() {
        windowControl(index);
        return false;
    }; // Toggle window with given index

    // Initialize icon for window toggle "button"
    const iconImage = document.createElement("img");
    iconImage.classList.add("akito-iconImage");
    iconClick.appendChild(iconImage);
    iconImage.src = iconURL;

    // Initialize actual window with given width, height, and left offset
    const thisWindow = document.createElement("div");
    thisWindow.classList.add("akito-window");
    const contentDiv = document.createElement("div"); // Initialize in advance for compatibility?
    thisWindow.appendChild(contentDiv);
    if(compatibility === true) {
        contentDiv.classList.add("akito-windowContentCompat");
    } else {
        thisWindow.style.width = width;
        thisWindow.style.height = height;
        contentDiv.classList.add("akito-windowContent");
    }
    // Best Buy doesn't let me set the left property that's so stupid
    windowsInfo[index] = {
        open: false,
        selector: $(thisWindow),
    }

    // Initialize window header with title
    const header = generateWindowHeader(title);
    header.classList.add("akito-black");
    thisWindow.appendChild(header);

    // Add to document body and retrieve selector when loaded
    document.body.appendChild(thisWindow);
    $(thisWindow).hide(); // Best Buy forcing me to initially hide?
    if(compatibility === false) { new SimpleBar(contentDiv); }

    return [ thisWindow, contentDiv ];
}

// Generates page footer for script user interface (script info and other elements)
// @param {string} scriptText
// @param {string} messageText
function generateInterface(scriptText, messageText) {
    // Full-width footer containing script controls and output
    footer = document.createElement("div");
    footer.classList.add("akito-footer");

    // Script name/version/author information
    const scriptInfo = document.createElement("p");
    scriptInfo.classList.add("akito-scriptInfo");
    footer.appendChild(scriptInfo);
    scriptInfo.style.order = 0;
    scriptInfo.innerText = scriptText;

    // Miscellaneous message info (donation, link, etc.)
    const messageInfo = document.createElement("p");
    messageInfo.classList.add("akito-messageInfo");
    footer.appendChild(messageInfo);
    messageInfo.style.order = 1;
    messageInfo.innerHTML = messageText;

    // Append elements and process selectors on document load
    $(document).ready(function() {
        document.body.appendChild(footer);
    });
}

// Designates div for settings with onchange modification to passed settings
// number: current (number), valid (array of numbers)
// @param {DOMElement} settingsWindow
// @param {DOMElement} settingsDiv
// @param {Object} settings
function designateSettings(settingsWindow, settingsDiv, settings) {
    // Generate wrapper table element
    const settingsTable = document.createElement("table");
    settingsDiv.appendChild(settingsTable);
    settingsTable.classList.add("akito-table");

    // Transform and sort settings by type and alphabetical order
    const settingsArray = [];
    for(const property in settings) {
        settingsArray.push(settings[property]);
    }
    settingsArray.sort(function(value, value2) {
        if(value.index < value2.index) {
            return -1;
        } else if(value.index === value2.index) { // Shouldn't occur
            return 0;
        } else { // if value.index > value2.index
            return 1;
        }
    });

    // Add each setting as new row within table and attach onchange
    for(const setting of settingsArray) {
        // Generate row for specific setting
        const row = document.createElement("tr");
        row.classList.add("akito-settingsRow");
        settingsTable.appendChild(row);

        // Generate cell showing setting description (onhover?)
        const descriptionCell = document.createElement("td");
        descriptionCell.classList.add("akito-black");
        row.appendChild(descriptionCell);
        descriptionCell.innerHTML = `<b>${setting.description}</b>`;

        // Generate cell with actual switcher (checkbox, slider, etc.)
        // Currently no support for arrays because they're complicated
        const settingCell = document.createElement("td");
        settingCell.classList.add("akito-black");
        row.appendChild(settingCell);
        settingCell.style.align = "center";
        switch(setting.type) {
            case "boolean": // Checkbox
                const checkbox = document.createElement("input");
                checkbox.classList.add("akito-input");
                checkbox.classList.add("akito-black");
                settingCell.appendChild(checkbox);
                checkbox.setAttribute("type", "checkbox");
                checkbox.checked = setting.value;
                checkbox.onclick = function() {
                    setting.value = checkbox.checked;
                };

                break;
            case "number": // Numerical text input
                const numberInput = document.createElement("input");
                numberInput.classList.add("akito-input");
                numberInput.classList.add("akito-black");
                settingCell.appendChild(numberInput);
                numberInput.setAttribute("type", "number");
                numberInput.value = setting.value;
                $(numberInput).change(function() {
                    setting.value = numberInput.value;
                });

                break;
            case "string": // String text input 
                const stringInput = document.createElement("input");
                stringInput.classList.add("akito-input");
                stringInput.classList.add("akito-black");
                settingCell.appendChild(stringInput);
                stringInput.value = setting.value;
                $(stringInput).change(function() {
                    setting.value = stringInput.value;
                });

                break;
            case "button": // Button to click
                const button = document.createElement("button");
                button.classList.add("akito-input");
                button.classList.add("akito-settingsButton");
                settingCell.appendChild(button);
                button.innerText = "Click";
                button.onclick = setting.value;
                
                break;
            case "array": // Currently just string input
                const arrayInput = document.createElement("input");
                arrayInput.classList.add("akito-input");
                arrayInput.classList.add("akito-black");
                settingCell.appendChild(arrayInput);

                arrayInput.value = setting.value.join(",");
                $(arrayInput).change(function() {
                    setting.value = arrayInput.value.toString().split(",");
                });

                break;
        }
    }
}

// Designates div for logging and generates table appending function
// @param {DOMElement} contentDiv
// @returns {function}
async function designateLogging(loggingWindow, contentDiv) {
    // Initialize wrapper table element
    const loggingTable = document.createElement("table");
    contentDiv.appendChild(loggingTable);
    loggingTable.classList.add("akito-table");

    // Initialize wrapper copy button 
    const copyDiv = document.createElement("div");
    copyDiv.classList.add("akito-copyDiv");
    loggingWindow.appendChild(copyDiv);
    const copyClick = document.createElement("a"); 
    copyClick.classList.add("akito-copyClick");
    copyClick.href = "#";
    copyDiv.appendChild(copyClick);
    const copyImage = document.createElement("img");
    copyImage.classList.add("akito-copyImage");
    copyClick.appendChild(copyImage);
    copyImage.src = "https://image.flaticon.com/icons/png/512/88/88026.png";

    // Initialize wrapper trash button
    const trashDiv = document.createElement("div");
    trashDiv.classList.add("akito-trashDiv");
    loggingWindow.appendChild(trashDiv);
    const trashClick = document.createElement("a"); 
    trashClick.classList.add("akito-copyClick");
    trashClick.href = "#";
    trashDiv.appendChild(trashClick);
    const trashImage = document.createElement("img");
    trashImage.classList.add("akito-copyImage");
    trashClick.appendChild(trashImage);
    trashImage.src = "https://cdn2.iconfinder.com/data/icons/cleaning-19/30/30x30-10-512.png";

    // Retrieve logging data from Tampermonkey storage
    let logsData = await GM_getValue(`${scriptPrefix}_cachedLogs`, []);
    logsData = logsData.slice(0, 250); // Limit number of displayed logs to 250?

    // Generates timestamp and appends to logging table
    // @param {string} message
    const loggingFunction = async function(message, time = (new Date()), fromCached = false) {
        const row = document.createElement("tr");
        message = message.replace("<b>", `<strong style="font-weight:bold !important">`);
        message = message.replace("</b>", `</strong>`); // Add manual bolding support

        // Generate timestamp cell
        const timestamp = "[" + (time).toTimeString().split(' ')[0] + "]";
        const loggingCell = document.createElement("td");
        loggingCell.classList.add("akito-black");
        row.appendChild(loggingCell);
        loggingCell.innerHTML = `<strong style="font-weight:bold !important">${timestamp}</strong> ${message}`;

        loggingTable.insertBefore(row, loggingTable.firstChild);

        // Update cached logs if fresh
        if(fromCached === false) {
            logsData.push({ timestamp: time, message: message });
            await GM_setValue(`${scriptPrefix}_cachedLogs`, logsData);
        }
    }

    // Display previously cached logs via logging function
    for(const logData of logsData) {
        loggingFunction(logData.message, new Date(logData.timestamp), true);
    }

    // Delimit previous logs, don't show POST data
    loggingFunction(`== ${location.href} ==`); 

    // Setup copy function (logs as well)
    copyClick.onclick = async function() { 
        let copyString = "";
        for(const row of loggingTable.childNodes) {
            copyString += row.innerText + "\n";
        }
        GM_setClipboard(copyString);

        loggingFunction("Successfully copied logs to clipboard");
    };

    // Setup trash function (logs as well)
    trashClick.onclick = async function() {
        logsData = []; // Clear existing logs and update
        await GM_setValue(`${scriptPrefix}_cachedLogs`, logsData); 
        loggingTable.innerHTML = ""; // Clear data from logging "console"
    }

    return loggingFunction;
}