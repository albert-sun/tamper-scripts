// Calls a given callback whenever the array is modified through Proxies.
// Supports calling back from both get and set (through weird runtime variable check)
// @param {array} array
// @param {function} callback
// @returns {Proxy (array wrapper)}
function callbackArray(array, callback, getSet) {
    return new Proxy(array, {
        get: function(target, property) {
            if(getSet.includes("get")) { callback(); }

            return target[property];
        },
        set: function(target, property, value) {
            target[property] = value;
            if(getSet.includes("set")) { callback(); }

            return true;
        }
    });
}

// Calls a given callback whenever the given object property is set through getters and setters.
// Existing property will be stored within alternate property (prefixed by _), no guaranteess through.
// Supports calling back from both get and set (using includes instead of case matching)
// @param obj
// @param {string} property
// @param {function} callback
// @param {string} getSet
function callbackObject(obj, property, callback, getSet) {
    const altProperty = "_" + property;
    obj[altProperty] = obj[property]; // Migrate in advance
    if(getSet.includes("get")) { // Object getter callback
        Object.defineProperty(obj, property, {
            configurable: true,
            get: function() { 
                loggingFunction(`Get callback triggered for property ${property}`);
                callback(); // Can be async function

                return obj[altProperty];
            },
            set: function(value) { obj[altProperty] = value; }
        });
    }
    if(getSet.includes("set")) { // Object setter callback
        Object.defineProperty(obj, property, {
            configurable: true,
            get: function() { return obj[altProperty]; },
            set: function(value) {
                obj[altProperty] = value;

                loggingFunction(`Set callback triggered for property ${property}`);
                callback(); // Can be async function
            }
        });
    }
}

// Checks whether the string contains a whitelist keyword or any blacklist keyword.
// Returns true if no blacklist keywords are found AND a whitelist keyword is found, otherwise returns false.
// @param {string} string
// @param {array} blacklist
// @param {array} whitelist
function checkBlackWhitelist(string, blacklist, whitelist) {
    // Check within blacklist array
    for(const blackWord of blacklist) {
        if(string.includes(blackWord)) {
            return false;
        }
    }

    // Check within whitelist array
    for(const whiteWord of whitelist) {
        if(string.includes(whiteWord)) {
            return true;
        }
    }

    return false;
}

// Attaches getters and setters to an object property to detect edge transitions from and to given values.
// Calls callback once specified edge transition detected.
// Unfortunately only currently works on objects because defineProperty is much more complicated on primitives.
// @param obj
// @param {string} property
// @param {primitive} initial
// @param {primitive | array} final
// @param {function} callback
async function edgeDetect(obj, property, initial, final, callback) {
    // Replace final string input with equivalent array
    if(typeof final === "string") {
        final = [final];
    }

    const altProperty = "_" + property;
    obj[altProperty] = obj[property]; // Move to alt property
    delete(obj[property]);
    Object.defineProperty(obj, property, {
        configurable: true,
        get: function() { return obj[altProperty]; },
        set: function(value) {
            // Check whether edge transitions match given
            if(obj[altProperty] === initial && final.includes(value)) {
                loggingFunction(`Edge transition detected from ${obj[altProperty]} to ${value}`);

                // Delete getter/setter and reset property
                delete obj[property];
                obj[property] = obj[altProperty];
                delete obj[altProperty];

                callback();
            }

            obj[altProperty] = value;
        }
    });
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
    for(checkColor of colors) {
        const distance = Math.sqrt((parsedColor.r - checkColor.r) ** 2 + (parsedColor.g - checkColor.g) ** 2 + (parsedColor.b - checkColor.b));
        if(distance < closest.distance) {
            closest.color = checkColor.color;
            closest.distance = distance;
        }
    }

    return closest.color;
}