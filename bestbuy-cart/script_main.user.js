// ==UserScript==
// @name         Best Buy - Cart Saved Items Automation
// @namespace    akito
// @version      3.3.1
// @author       akito#9528 / Albert Sun
// @require      https://raw.githubusercontent.com/albert-sun/tamper-scripts/bestbuy-cart_3.3/bestbuy-cart/user_interface.js
// @require      https://raw.githubusercontent.com/albert-sun/tamper-scripts/bestbuy-cart_3.3/bestbuy-cart/constants.js
// @require      https://cdn.jsdelivr.net/npm/simplebar@latest/dist/simplebar.min.js
// @resource css https://raw.githubusercontent.com/albert-sun/tamper-scripts/bestbuy-cart_3.3/bestbuy-cart/styling.css
// @downloadURL  https://raw.githubusercontent.com/albert-sun/tamper-scripts/bestbuy-cart_3.3/bestbuy-cart/script_main.user.js
// @updateURL    https://raw.githubusercontent.com/albert-sun/tamper-scripts/bestbuy-cart_3.3/bestbuy-cart/script_main.user.js
// @match        https://www.bestbuy.com/cart
// @antifeature  opt-in anonymous queue metrics
// @run-at       document-end
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @noframes
// ==/UserScript==
/* globals $, __META_LAYER_META_DATA, constants  */
/* globals generateInterface, generateWindow, designateSettings, designateLogging*/

const scriptVersion = "3.3.1";
const scriptPrefix = "BestBuy-CartSavedItems";
const scriptText = `Best Buy - Cart Saved Items Automation v${scriptVersion} | akito#9528 / Albert Sun`;
const messageText = `Thanks and good luck! | <a href="https://www.paypal.com/donate?business=GFVTB9U2UGDL6&currency_code=USD">Donate via PayPal</a>`;

// Script-specific settings including their descriptions, types, and default values
// /!\ DO NOT MODIFY AS IT  PROBABLY WON'T DO ANYTHING, use the settings popup instead /!\
const settings = {
    "allowMetrics": { index: 0, description: "Allow sending of anonymous queue metrics", type: "boolean", value: false },
    "autoAddClick": { index: 1, description: "Auto-click whitelisted buttons when available", type: "boolean", value: true },
    "pauseWhenCarted": { index: 2, description: "Pause interval actions when cart occupied", type: "boolean", value: true },
    "ignoreFailed": { index: 3, description: "Ignore cart buttons if still clickable after clicked (failed)", type: "boolean", value: false },
    "refreshCartChange": { index: 4, description: "Refresh the page when cart contents change (recommended)", type: "boolean", value: true },
    "clickTimeout": { index: 5, description: "Timeout between clicks to prevent rate limiting", type: "number", value: 1000 },
    "globalInterval": { index: 6, description: "Global polling interval for updates (milliseconds)", type: "number", value: 250 },
    "clickTimeout": { index: 7, description: "Script timeout when clicking add buttons (milliseconds)", type: "number", value: 1000 },
    "autoReloadInterval": { index: 8, description: "Automatic page reloading interval (milliseconds, 0 / >= 10000)", type: "number", value: 0 },
    "customNotification": { index: 9, description: "Hotlinking URL for custom notification (empty for default)", type: "string", value: constants.notificationSound },
    "testNotification": { index: 10, description: "[ Press to test the current notification sound ]", type: "button", value: function() { notificationSound.play() } },
    "useSKUWhitelist": { index: 11, description: "Override the keyword whitelist with the SKU whitelist", type: "boolean", value: false },
    "whitelistKeywords": { index: 12, description: "Whitelisted keywords (array)", type: "array", value: constants.whitelistKeywords },
    "blacklistKeywords": { index: 13, description: "Blacklisted keywords (array)", type: "array", value: constants.blacklistKeywords },
    "whitelistSKUs": { index: 14, description: "Whitelisted SKUs to track (array, NOT UP-TO-DATE)", type: "array", value: constants.whitelistSKUs },
    // Note: script currently ignores bundles including the PS5 bundles
};

// Script-scoped variables, again please don't modify this unless you know what you're doing
const trackedItems = {}; // button, color, description
const ignoreStatuses = {}; // false = just clicked, true = ignore
let notificationSound; // Imported from settings
let sentQueueCodes; // For analytics purposes, imported from storage
let settingsWindow, settingsDiv, loggingWindow, loggingDiv;
let loggingFunction = undefined; // Placeholder for initialization
let whitelistKeywords = [];
let blacklistKeywords = []; // Blacklist > whitelist
let whitelistSKUs = [];

// Asynchronous sleep function, fixed for Firefox?
async function sleep(ms) {
    await new Promise((resolve) => { setTimeout(resolve, ms); });
}

// Initialize script user interface consisting of footer and individual windows
// In particular, initializes settings and logging window (and logging function) before others
// @returns {boolean} whether initialization succeeded or failed
async function initialize() {
    // Load script-wide CSS
    GM_addStyle(GM_getResourceText("css"));

    // Import seen queue codes from storage
    sentQueueCodes = await GM_getValue(`${scriptPrefix}_sentQueueCodes`, []);

    // Generate base script footer for user interface
    generateInterface(scriptText, messageText);

    // Load settings from defaults or Tampermonkey storage
    for(const [property, setting] of Object.entries(settings)) {
        const lookupKey = `${scriptPrefix}_${property}`;
        const storedValue = await GM_getValue(lookupKey, setting.value);

        // Attach setter to given setting for saving any changes
        setting._value = storedValue;
        delete setting.value;
        Object.defineProperty(setting, "value", {
            get: function() { return setting._value; },
            set: function(value) {
                setting._value = value;
                GM_setValue(lookupKey, value);
            }
        });
    }

    if(settings.customNotification.value === "") {
        notificationSound = new Audio(constants.notificationSound);
    } else {
        notificationSound = new Audio(settings.customNotification.value);
    }

    // Generate footer buttons and their respective windows, then designate
    [settingsWindow, settingsDiv] = generateWindow(constants.settingsIcon, "Settings (updates on reload)", 800, 400, true);
    [loggingWindow, loggingDiv] = generateWindow(constants.loggingIcon, "Logging", 800, 400, true);
    designateSettings(settingsWindow, settingsDiv, settings);
    loggingFunction = await designateLogging(loggingWindow, loggingDiv);

    loggingFunction("Finished initializing script user interface");

    // Validate settings once logging function is initialized
    try { // Attempt to parse and set whitelisted keywords
        whitelistKeywords = settings.whitelistKeywords.value.filter(word => word != "");
        if(Array.isArray(whitelistKeywords) === false) { throw new Error("not an array"); }
    } catch(err) {
        loggingFunction(`/!\\ Error parsing whitelisted keywords: <b>${err.message}</b>`);
        return false;
    }
    try { // Attempt to parse and set blacklisted keywords
        blacklistKeywords = settings.blacklistKeywords.value.filter(word => word != "");
        if(Array.isArray(blacklistKeywords) === false) { throw new Error("not an array"); }
    } catch(err) {
        loggingFunction(`/!\\ Error parsing blacklisted keywords: <b>${err.message}</b>`);
        return false;
    }
    try { // Attempt to parse and set whitelisted SKUs
        whitelistSKUs = settings.whitelistSKUs.value;
        if(Array.isArray(whitelistSKUs) === false) { throw new Error("not an array"); }
    } catch(err) {
        loggingFunction(`/!\\ Error parsing whitelisted SKUs: <b>${err.message}</b>`);
        return false;
    }

    return true
}

// Approximates the rendered background color of a given element to a given set of colors.
// Checks whether the "distance" from the element color is transparent or closest to either yellow/white/blue.
// @param {element} element
// @returns {string} color
const colors = [
    {color: "yellow", r: 255, g: 224, b: 0},
    {color: "blue", r: 0, g: 30, b: 115},
    {color: "grey", r: 197, g: 203, b: 213},
    {color: "white", r: 255, g: 255, b: 255},
];
function elementColor(element) {
    // Get the rendered background color of the element
    const colorText = getComputedStyle(element, null).getPropertyValue("background-color");
    if(colorText.includes("rgb(0, 0, 0")) { // element has no color = transparent
        return "transparent";
    }

    // Parse RGB value and use fancy maths to find closest color
    const parsedColor = {};
    const matchedColor = colorText.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    parsedColor.r = Number(matchedColor[1]); parsedColor.g = Number(matchedColor[2]); parsedColor.b = Number(matchedColor[3]);
    const closest = {color: "", distance: 442}; // Default distance just slightly larger than max
    for(const checkColor of colors) {
        const distance = Math.sqrt((parsedColor.r - checkColor.r) ** 2 + (parsedColor.g - checkColor.g) ** 2 + (parsedColor.b - checkColor.b));
        if(distance < closest.distance) {
            closest.color = checkColor.color;
            closest.distance = distance;
        }
    }

    return closest.color;
}

// Saved items tracker function caching saved items elements and polling for color changes?
async function trackSaved() {
    loggingFunction("Waiting until saved items elements are loaded into DOM");

    // Periodically poll until saved items loaded by checking header existence
    while(document.getElementsByClassName("saved-items__header").length === 0) {
        await sleep(settings.globalInterval.value);
    } // Then, retrieve complete list of relevant saved items information
    const savedSKUs = $(".saved-items__card-wrapper").toArray()
        .map(wrapperElement => wrapperElement.getAttribute("data-test-saved-sku"));
    const savedDescriptions = $(".saved-items__card-wrapper .simple-item__description").toArray()
        .map(descriptionElement => descriptionElement.innerText);
    const savedButtons = $(".saved-items__card-wrapper .btn.btn-block").toArray();

    loggingFunction(`<b>${savedSKUs.length}</b> saved items found, filtering through whitelist and blacklist`);

    // Parse keywords / SKUs for each and splice blacklisted or non-whitelisted
    let index = savedSKUs.length;
    while(index--) { // Loop in reverse to allow splicing
        const sku = savedSKUs[index];
        const description = savedDescriptions[index];

        // Verify thorugh keyword descriptions or SKU depending on setting
        let valid = false; // Placeholder value
        if(settings.useSKUWhitelist.value === true) {
            valid = whitelistSKUs.includes(Number(sku));
        } else { // if settings["useSKUWhitelist"].value === false
            const containsWhitelist = whitelistKeywords.filter(
                keyword => description.toLowerCase().includes(keyword.toLowerCase())
            ).length > 0; // Whether description contains any whitelisted keywords
            const containsBlacklist = blacklistKeywords.filter(
                keyword => description.toLowerCase().includes(keyword.toLowerCase())
            ).length > 0; // Whether description contains any blacklisted keywords

            valid = containsWhitelist === true && containsBlacklist === false;
        }

        // If don't track item, splice from array
        if(valid === false) {
            loggingFunction(`Script not tracking <b>${description}</b> as product is either unwhitelisted or blacklisted`);

            savedSKUs.splice(index, 1);
            savedDescriptions.splice(index, 1);
            savedButtons.splice(index, 1);
        }
    }

    loggingFunction(`Finished filtering whitelisted items, <b>${savedSKUs.length}</b> items remaining`);
    loggingFunction(`Initializing polling interval for auto-clicking items with clickable buttons`);

    // Iterate through remaining and check which ones are clickable / queued
    for(const index in savedSKUs) {
        const sku = savedSKUs[index];
        const button = savedButtons[index];
        const description = savedDescriptions[index];
        const buttonColor = elementColor(button);

        // Check whether button currently clickable or queued by checking button text
        // Honestly ignoring anything that says "Find a Store" since the script can't choose stores
        if(button.innerText === "Add to Cart") {
            if(buttonColor === "grey") {
                loggingFunction(`Currently queued: <b>${description}</b>`);
            }

            trackedItems[sku] = {
                button: button,
                color: buttonColor,
                description: description,
            }
        }
    }

    // Initializing polling interval with cooldown on click
    // Replace asynchronous polling with synchronous polling for delays and stuff
    while(true) {
        // Check whether cart contains item
        if(__META_LAYER_META_DATA.order.lineItems.length > 0) {
            loggingFunction(`Cart currently has item, cancelling polling interval`);

            return;
        }

        // Iterate over trackable items, update color, and click if popped
        for(const [sku, trackedInfo] of Object.entries(trackedItems)) {
            trackedInfo.color = elementColor(trackedInfo.button);
            if(trackedInfo.color === "white" || trackedInfo.color === "blue" || trackedInfo.color === "yellow") {
                loggingFunction(`Clickable initial / popped: <b>${trackedInfo.description}</b>`);

                // Check current ignore status and process if enabled
                // TODO: check error message popup instead of doing this ignore stuff
                if(settings.ignoreFailed.value === true) {
                    // Undefined = nothing flagged, false = clicked, true = ignore
                    if(ignoreStatuses[sku] === undefined) {
                        ignoreStatuses[sku] = false;
                    } else if(ignoreStatuses[sku] === false) {
                        ignoreStatuses[sku] = true;

                        continue;
                    } else if(ignoreStatuses[sku] === true) {
                        // Flagged to ignore
                        continue;
                    }
                }

                trackedInfo.button.click(); // Click button obviously
                await sleep(settings.clickTimeout.value);
            } else {
                // Remove flag from SKU because successful color flip
                // Does nothing if undefined property
                delete ignoreStatuses[sku];
            }
        }

        // ANTIFEATURE: send anonymous queue data gathered through localStorage
        // Leave the analytics to last in case it breaks (somehow) and throws an error which would kill the function
        // Queue data can't be transported even between sessions, believe me I've tried...
        if(settings.allowMetrics.value === true) {
            // Retrieve current queues from page laod and send queue information
            const queuesData = JSON.parse(atob(localStorage.getItem("purchaseTracker"))) || {};
            for(const [sku, queueData] of Object.entries(queuesData)) {
                const bundle = [sku, ...queueData]; // SKU and queue data

                // Prevent duplicate requests by marking codes as seen
                if(sentQueueCodes.includes(queueData[2])) {
                    continue;
                }
                sentQueueCodes.push(queueData[2]);
                GM_setValue(`${scriptPrefix}_sentQueueCodes`, sentQueueCodes);

                // Sending repeat queues shouldn't matter that much honestly, Cloudflare is generous?
                loggingFunction(`Sending queue analytics for saved item with SKU <b>${sku}</b>`);
                await fetch("https://bestbuy-queue-analytics.akitocodes.workers.dev/", {
                    method: "POST",
                    body: JSON.stringify({
                        data: bundle,
                        version: scriptVersion,
                    }),
                });
            }
        }

        await sleep(settings.globalInterval.value)
    }
}

// Main function, called using async wrapper below
async function main() {
    'use strict'; // Something about ES6 syntax?

    // Perform initialization separate from main
    const initResult = await initialize();
    if(initResult === false) { // loggingFunction should be initialized
        loggingFunction("Stopping script because initialization failed");
        return;
    }

    // Metadata includes run-at document-end, shouldn't need DOMContentLoaded event

    loggingFunction("Initializing saved items queue tracker (bundles currently not supported)");

    trackSaved(); // Run in parallel

    loggingFunction("Initializing cart tracker to automatically refresh on contents change");

    // Attach setter to cart order to receive callback whenever contents change
    // Reload the page whenever the cart contents change since saved elements unload and reload
    let initialCartLoad = false; // To prevent refreshing on page load
    __META_LAYER_META_DATA._order = __META_LAYER_META_DATA.order;
    Object.defineProperty(__META_LAYER_META_DATA, "order", {
        get: function() { return __META_LAYER_META_DATA._order; } ,
        set: function(newOrder) {
            try {
                const oldCartLength = __META_LAYER_META_DATA.order ? __META_LAYER_META_DATA.order.lineItems.length : 0;
                const newCartLength = newOrder.lineItems.length;

                if(newCartLength !== oldCartLength) {
                    loggingFunction(`Detected cart length change: <b>${oldCartLength}</b> -> <b>${newCartLength}</b>`);

                    // Play notification sound when item added to cart
                    if(newCartLength > oldCartLength) {
                        loggingFunction(`Product added to cart, playing default or custom notification sound`);

                        notificationSound.play();
                    }

                    // Only refresh page on cart change if enabled in settings
                    if(settings.refreshCartChange.value === true && initialCartLoad === true) {
                        // Timeout page reload to let notification sound play fully
                        setTimeout(function() { location.reload(); }, 1000);
                    } else if(initialCartLoad === false) {
                        initialCartLoad = true;
                    }
                }
            } catch(err) {
                loggingFunction(`/!\\ Error from cart setter: <b>${err.message}</b>`);
            }

            __META_LAYER_META_DATA._order = newOrder;
        }
    });

    if(settings.autoReloadInterval.value >= 10000) {
        loggingFunction(`Queued page auto-reload interval for <b>${settings.autoReloadInterval.value}</b> milliseconds`);

        setTimeout(function() { location.reload() }, settings.autoReloadInterval.value);
    } else {
        loggingFunction("Not queueing auto-reload interval because zero or too short interval");
    }
}

(async function() { await main(); }());