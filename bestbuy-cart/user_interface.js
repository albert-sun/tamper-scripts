let footer; // Footer containing all icons and statuses
let windowIndex = 0; // Index of generated window
const statuses = []; // Window open statuses (true / false)
const selectors = []; // Window elements for sliding

// Displayed windows slideToggle control ensuring only one window at a time is shown.
// Faster sliding transition when closing previous window when new window is being opened.
function windowControl(index) {
    if(statuses[index] === true) { // Window currently open, close it
        statuses[index] = !statuses[index]; // Open -> closed
        selectors[index].slideToggle(400);
    } else { // Window currently closed
        // Close any windows currently open (should be one max)
        for(const ind in statuses) {
            if(statuses[ind] === true) {
                statuses[ind] = !statuses[ind];; // Open -> closed
                selectors[ind].slideToggle(200);
            }
        }

        statuses[index] = !statuses[index]; // Closed -> open
        selectors[index].slideToggle(400);
    }
};

// Generate red-orange header with text, pretty simple.
// @param {string} text
// @returns {DOMElement}
function generateHeader(text) {
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
    statuses[index] = false;
    selectors[index] = j$(thisWindow);

    // Initialize window header with title
    const header = generateHeader(title);
    header.classList.add("akito-black");
    thisWindow.appendChild(header);

    // Add to document body and retrieve selector when loaded
    window.addEventListener("DOMContentLoaded", function(_) {
        document.body.appendChild(thisWindow);
        j$(thisWindow).hide(); // Best Buy forcing me to initially hide?
        if(compatibility === false) { new SimpleBar(contentDiv); }
    });

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
    j$(document).ready(function() {
        document.body.appendChild(footer);
    });
}

// Small function for "weighing" the settings type for sorting
// @param {Object} value
function settingsWeight(value) {
    switch(value.type) {
        case "boolean": return 0;
        case "number": return 1;
        case "array": return 2;
    }
}

// Designates div for settings with onchange modification to passed settings
// number: current (number), valid (array of numbers)
// @param {DOMElement} contentDiv
// @param {Object} settings
function designateSettings(contentDiv, settings) {
    // Generate wrapper table element
    const settingsTable = document.createElement("table");
    contentDiv.appendChild(settingsTable);
    settingsTable.classList.add("akito-table");

    // Transform and sort settings by type and alphabetical order
    const settingsArray = [];
    for(const property in settings) {
        settingsArray.push(settings[property]);
    }
    settingsArray.sort(function(value, value2) {
        const valueWeight = settingsWeight(value);
        const value2Weight = settingsWeight(value2);

        if(valueWeight < value2Weight) {
            return -1;
        } else if(valueWeight === value2Weight) {
            if(value.description < value2.description) {
                return -1;
            } else if(value.description === value2.description) {
                return 0; // Should never happen
            } else {
                return 1;
            }
        } else {
            return 1;
        }
    });

    // Add each setting as new row within table and attach onchange
    for(const setting of settingsArray) {
        // Generate row for specific setting
        const row = document.createElement("tr");
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
        settingCell.classList.add("akito-tableCell");
        row.appendChild(settingCell);
        settingCell.style.align = "center";
        switch(setting.type) {
            case "boolean": // Checkbox
                const checkbox = document.createElement("input");
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
                numberInput.classList.add("akito-black");
                settingCell.appendChild(numberInput);
                numberInput.setAttribute("type", "number");
                numberInput.value = setting.value;
                j$(numberInput).change(function() {
                    setting.value = numberInput.value;
                });
                break;
            case "string": // String text input 
                const stringInput = document.createElement("input");
                stringInput.classList.add("akito-black");
                settingCell.appendChild(stringInput);
                stringInput.value = setting.value;
                j$(stringInput).change(function() {
                    setting.value = stringInput.value;
                });
                break;
            case "array": break; // Currently not implemented
        }
    }
}

// Designates div for logging and generates table appending function
// @param {DOMElement} contentDiv
// @returns {function}
function designateLogging(window, contentDiv) {
    // Initialize wrapper table element
    const loggingTable = document.createElement("table");
    contentDiv.appendChild(loggingTable);
    loggingTable.classList.add("akito-table");

    // Initialize wrapper copy button div
    const copyDiv = document.createElement("div");
    copyDiv.classList.add("akito-copyDiv");
    window.appendChild(copyDiv);

    // Initialize copy button element
    const copyClick = document.createElement("a");
    copyClick.classList.add("akito-copyClick");
    copyClick.href = "#";
    copyDiv.appendChild(copyClick);

    // Initialize icon for logging copy button
    const copyImage = document.createElement("img");
    copyImage.classList.add("akito-copyImage");
    copyClick.appendChild(copyImage);
    copyImage.src = "https://image.flaticon.com/icons/png/512/88/88026.png";

    // Generates timestamp and appends to logging table
    // @param {string} message
    const loggingFunction = function(message) {
        const row = document.createElement("tr");

        // Generate timestamp cell
        const timestamp = "[" + (new Date()).toTimeString().split(' ')[0] + "]";
        const loggingCell = document.createElement("td");
        loggingCell.classList.add("akito-black");
        loggingCell.classList.add("akito-tableCell");
        row.appendChild(loggingCell);
        loggingCell.innerHTML= `<strong style="font-weight:bold !important">${timestamp}</strong> ${message}`;

        loggingTable.insertBefore(row, loggingTable.firstChild);
    }

    // Setup copy function (logs as well)
    copyClick.onclick = function() { 
        let copyString = "";
        for(const row of loggingTable.childNodes) {
            copyString += row.innerText + "\n";
        }
        GM_setClipboard(copyString);

        loggingFunction("Copied debug logs to clipboard");
    };

    return loggingFunction;
}