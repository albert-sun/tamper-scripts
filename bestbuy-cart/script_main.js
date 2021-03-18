// ==UserScript==
// @name         Best Buy Automation (Cart Saved Items)
// @namespace    akito
// @version      2.2.0
// @description  Best Buy queue automation for saved items from the cart page
// @author       akito#9528 / Albert Sun
// @updateURL    https://raw.githubusercontent.com/albert-sun/tamper-scripts/main/bestbuy-cart/script_main.js
// @downloadURL  https://raw.githubusercontent.com/albert-sun/tamper-scripts/main/bestbuy-cart/script_main.js
// @require      https://raw.githubusercontent.com/albert-sun/tamper-scripts/main/bestbuy-cart/utilities.js
// @require      https://raw.githubusercontent.com/albert-sun/tamper-scripts/main/bestbuy-cart/user_interface.js
// @require      https://code.jquery.com/jquery-2.2.3.min.js
// @require      https://cdn.jsdelivr.net/npm/simplebar@latest/dist/simplebar.min.js
// @resource css https://raw.githubusercontent.com/albert-sun/tamper-scripts/main/bestbuy-cart/styling.css
// @match        https://www.bestbuy.com/cart
// @run-at       document-start
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// ==/UserScript==
/* globals $, callbackArray, callbackObject, checkBlackWhitelist, edgeDetect, elementColor */
/* globals generateInterface, generateWindow, designateLogging, designateSettings */
const j$ = $; // Just in case websites like replacing $ with some abomination

const version = "2.2.0";
const scriptName = "bestBuy-cartSavedItems"; // Key prefix for settings retrieval
const scriptText = `Best Buy (Cart Saved Items) v${version} | Albert Sun / akito#9528`;
const messageText = "Thank you and good luck! | https://github.com/albert-sun/tamper-scripts";

// Script-specific settings, please don't modify as it probably won't do anything!
// Instead, use the settings user interface implemented within the script itself.
const settings = {
    checkAdblock: { description: "Primitive Adblock Check", type: "boolean", value: true },
    initialClick: { description: "Auto-Add Button Clicking", type: "boolean", value: true },
    colorInterval: { description: "Color Polling Interval (ms)", type: "number", value: 250 },
    loadUnloadInterval: { description: "Load/Unload Polling Interval (ms)", type: "number", value: 50 },
    errorResetDelay: { description: "Error Reset Delay (ms)", type: "number", value: 250 },
    cartCheckDelay: { description: "Cart Checking Delay (ms)", type: "number", value: 250 },
    cartSkipTimeout: { description: "Cart Skip Timeout (ms)", type: "number", value: 5000 },
};
const storage = {
    buttons: {}, //_________ mapping SKU -> add button elements
    colors: {}, //__________ mapping SKU -> current button color
    descriptions: {}, //____ mapping SKU -> product description
    intervalIDs: {}, //_____ mapping SKU -> setInterval IDs
}; // Dedicated storage variable for script usage
const adblockURLs = [
    "https://pubads.g.doubleclick.net/ssai/event/",
    "https://googleads.g.doubleclick.net/pagead/html/",
    "https://online-metrix.net/",
]; // Test request URLs for detecting adblock status
const keyWhitelist = ["3060", "3070", "3080", "3090", "6800", "6900", "5600X", "5800X", "5900X", "5950X", "PS5"];
const keyBlacklist = []; // Temporary, blacklist > whitelist
const audio = new Audio("https://github.com/albert-sun/tamper-scripts/blob/main/notification.mp3?raw=true");
let loggingFunction = undefined; // Leave for "global" logging usage by script and requirements

// Load script user interface consisting of footer and individual windows
// Also generates and sets debug logging function for script-wide usage
// @returns {function}
async function loadInterface() {
    // Load SimpleBar and script-wide CSS
    GM_addStyle(GM_getResourceText("css"));

    // Load script settings from Tampermonkey storage
    for(const property in settings) {
        const lookupKey = `${scriptName}_${property}`;
        const storageValue = await GM_getValue(lookupKey, settings[property].value);

        // Attach setter to settings to save any changes
        // Inconvenient because it requires separate property for each child...
        settings[property]._value = storageValue;
        delete settings[property].value;
        Object.defineProperty(settings[property], "value", {
            get: function() { return settings[property]._value; },
            set: function(value) {
                settings[property]._value = value;
                GM_setValue(lookupKey, value);
            }
        });
    }

    // Generate script footer and windows
    generateInterface(scriptText, messageText);
    const settingsDiv = generateWindow(
        "https://cdn3.iconfinder.com/data/icons/google-material-design-icons/48/ic_settings_48px-512.png",
        "Settings (Updates on Refresh)", // Width height ignored because compatibility mode
        400, 400, true // Compatibility mode enabled
    );
    const loggingDiv = generateWindow(
        "https://cdn2.iconfinder.com/data/icons/font-awesome/1792/code-512.png",
        "Debug Logging", // Width height ignored because compatibility mode
        800, 400, true // Compatibility mode enabled
    );

    // Designate the two windows as setting and logging windows
    designateSettings(settingsDiv, settings);
    const logFunc = designateLogging(loggingDiv);

    logFunc("Finished initializing script user interface");

    return logFunc;
}

// Called on cart change, clear storage and re-retrieve HTML attributes of saved items
// Saved item elements are unloaded and reloaded with identical but different instances.
// On initial page load, skipUnload = true to skip element unloading polling.
// @param {boolean} skipUnload
// @param {boolean} fromCart
async function resetSaved(skipUnload, fromCart) {
    loggingFunction(`Saved elements reset triggered from ${fromCart === true ? "non-" : ""}cart source`);
    loggingFunction("Clearing existing watcher polling intervals and temporary storage");

    // Clear existing queue polling intervals
    // Then, clear storage attributes by resetting to empty object
    for(const sku in storage.intervalIDs) {
        clearInterval(storage.intervalIDs[sku]);
    }
    storage.buttons = {};
    storage.colors = {};
    storage.descriptions = {};
    storage.intervalIDs = {};

    // Periodically poll until saved items unload and reload
    let savedWrappersRes;
    if(fromCart) { await new Promise(r => setTimeout(r, settings.cartCheckDelay.value)); } // Extra wait, for cart or something idek anymore
    if($(".removed-item-info__wrapper")[0] === undefined || skipUnload === true) { // Wait instead of polling for removed
        loggingFunction("Waiting for saved item elements to unload from document");

        do { // Wait for existing saved items elements to unload
            savedWrappersRes = $(".saved-items__card-wrapper");
            await new Promise(r => setTimeout(r, settings.loadUnloadInterval.value));
        } while(savedWrappersRes.length !== 0);

        loggingFunction("Finished waiting for saved item elements unloading");
    } else if($(".removed-item-info__wrapper")[0] !== undefined) { // Weird edge case where elements never truly "disappear", wait instead
        loggingFunction("Detected product removed from cart, performing alternate safety delay instead");

        await new Promise(r => setTimeout(r, settings.cartSkipTimeout.value));
    }

    loggingFunction("Waiting for document to be populated with \"new\" saved item elements");

    do { // Wait for "new" saved items elements to load
        savedWrappersRes = $(".saved-items__card-wrapper");
        await new Promise(r => setTimeout(r, settings.loadUnloadInterval.value));
    } while(savedWrappersRes.length === 0);

    loggingFunction("Finished waiting for \"new\" saved item elements to load");

    // Convert selector result and parse other elements
    const savedSKUs = savedWrappersRes.toArray().map(element => element.getAttribute("data-test-saved-sku"));
    const descriptionElements = $(".saved-items__card-wrapper .simple-item__description").toArray();
    const savedDescriptions = descriptionElements.map(element => element.innerText);
    const savedButtons = $(".saved-items__card-wrapper .btn.btn-block").toArray();

    loggingFunction(`${savedDescriptions.length} saved items found, filtering whitelist (currently hardcoded into script)`);

    // Parse keywords of each and splice those with blacklisted or without whitelisted
    let index = savedDescriptions.length;
    while(index--) { // Loop in reverse to allow splicing
        const description = savedDescriptions[index];
        const valid = checkBlackWhitelist(description, keyBlacklist, keyWhitelist);
        if(valid === false) { // Check whether the saved item is allowed
            savedSKUs.splice(index, 1);
            savedDescriptions.splice(index, 1);
            savedButtons.splice(index, 1);
        }
    }

    loggingFunction(`Finished filtering, ${savedDescriptions.length} saved items remaining for traversal`);
    loggingFunction(`Iterating through remaining elements for iinitial clicking and color interval setup`);

    // Iterate through buttons and deduce whether addable, queued, or unavailable
    // If addable, click the button (hopefully error element detector callback triggers)
    // If queued, store relevant info, initiate setInterval, and initiate edge detection
    let anyClicked = false;
    for(const index in savedButtons) {
        const button = savedButtons[index];
        const buttonColor = elementColor(button);
        const description = savedDescriptions[index];
        const available = !button.classList.contains("disabled");
        if((buttonColor === "white" || buttonColor === "blue") && settings.initialClick.value) { // Addable, should be available?
            loggingFunction(`[${description}] currently addable, clicking and refreshing after iterating finished`);

            button.click();
            anyClicked = true;
        } else if(buttonColor === "grey" && available === true) { // Currently queued
            if(anyClicked === true) {
                loggingFunction(`[${description}] currently in queue but not initializing polling interval pending refresh`);
                continue;
            }

            loggingFunction(`[${description}] currently in queue, initializing check interval and attaching callback`);

            // Store relevant info into storage
            const sku = savedSKUs[index];
            storage.buttons[sku] = button;
            storage.colors[sku] = "grey";
            storage.descriptions[sku] = savedDescriptions[index];

            // Initiate periodic interval for updating element color
            // Remember that intervals are cleared on each resetSaved call
            storage.intervalIDs[sku] = setInterval(function() {
                storage.colors[sku] = elementColor(storage.buttons[sku]);
            }, settings.colorInterval.value);

            // Initiate edge detection for callback color changes
            // I think it turns to white? Does it sometimes turn yellow as well?
            edgeDetect(storage.colors, sku, "grey", ["white", "yellow"], function() {
                loggingFunction(`Queue pop detected for [${description}], playing audio and clicking button`);

                audio.play();
                button.click();
            });
        }
    }

    // Force reload if any buttons are clicked to ensure status update
    if(anyClicked === true) {
        location.reload();
    }
}

(async function() {
    'use strict';

    // Load user interface including footer and windows
    loggingFunction = await loadInterface();

    // Primitive adblock check: check for failure when fetching commonly blocked domains
    let adblockDetected = undefined;
    if(settings.checkAdblock.value === true) {
        const promises = adblockURLs.map(url => fetch(url));
        const results = await Promise.allSettled(promises);
        const failed = results.filter(x => x.status !== "fulfilled");
        adblockDetected = failed.length > 0;

        loggingFunction("Finished primitive adblock check");
        if(adblockDetected === true) {
            loggingFunction("/!\\ Adblock detected, please disable for maximum website compatibility");
        }
    }

    addEventListener('DOMContentLoaded', async function() {
        loggingFunction("Setting-up reset callback on error message detection");

        // Force refresh of saved item elements whenever error detected using jQuery
        // Wait some time interval before refreshing to let auto-clicker finish clicking in runtime
        $(".alerts__order").bind('DOMNodeInserted', async function(e) {
            await new Promise(r => setTimeout(r, settings.errorResetDelay.value));
            await resetSaved(false, false);
        });

        loggingFunction("Performing initial setup of saved items watcher (no bundles currently, sorry!)");
        await resetSaved(true, false); // Initial call on page load

        loggingFunction("Setting-up reset callback on cart status change (including pickup/shipping modification)");

        // Force refresh of saved item elements whenever order summary changes (cart addition / removal?)
        // window.cart extraordinarily slippery, unable to hook getters/setters or anything
        // Currently triggers on picking/shipping swaps but don't want custom callback function...
        callbackObject(__META_LAYER_META_DATA, "order", function() { resetSaved(false, true) }, "set");
    });
}());

/*
== Current Bugs ==
- Clicking on "Please Wait" breaks periodic interval check
- Must reload page sometimes after clicking initial add because no "Please Wait" transition
== Current Testing Checklist ==
[X] Adblock detection user notification
[ ] Error message element DOM insert callback
[X] Cart addition / removal (/ fulfillment swap) callback
[X] Correct whitelist and blacklist keyword product filtering and splicing
[X] Correct added / queued / unavailable element detection
[X] Dummy queued availability callback (audio + click)
[X] Reset routine on cart addition / removal (/ fulfillment swap)
*/
