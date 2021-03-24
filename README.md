# Miscellaneous Tampermonkey Automation Userscripts  
{ [Installation](<https://github.com/albert-sun/tamper-scripts#Installation>) | [Current Scripts](<https://github.com/albert-sun/tamper-scripts#Current-Scripts>) | [Changelog](<https://github.com/albert-sun/tamper-scripts#Changelog>) | [Frequently Asked Question](<https://github.com/albert-sun/tamper-scripts#Frequently-Asked-Questions>) | [Notes](<https://github.com/albert-sun/tamper-scripts#Notes>) }

A collection of miscellaneous Tampermonkey userscripts primarily centered around automation and convenience. All scripts come with a convenient user interface for settings, logging, and other functionality. For script support, please provide me with the script used, version, page URL, logging output (if applicable), and detailed description of the issue.

⚠️ **DO NOT download anything straight from the main branch as it could be outdated (I only pull request major and minor script versions)**.⚠️  
**Please let me know if you ever got anything using my scripts, it makes me feel warm isnide knowing my scripts are at least somewhat useful. Thanks and good luck!**  

**Discord**: akito#9528  
**Twitch (direct message): AkitoApocalypse**  
[Donate via PayPal](<https://www.paypal.com/donate?business=GFVTB9U2UGDL6&currency_code=USD>) | 1KgcytPHXNwboNbXUN3ZyuASDZWt8Qcf1t | 0xAf9EB617c81B050517E9A8826E4c93DcC182AeaD

# Installation  
1. Install either the TamperMonkey extension for Chrome / derivatives or the GreaseMonkey extension for Firefox. 
2. Within the extension settings, set the script check interval (Tampermonkey: Settings -> Script Update) and the externals update interval (Tampermonkey: Settings -> Externals) to the lowest timeframe possible.
3. Copy the source for **only the main script** linked within [Current Scripts](<https://github.com/albert-sun/tamper-scripts#Current-Scripts>) and paste it into Tampermonkey / Greasemonkey as a new userscript. Ensure that the script is properly saved and enabled by pressing CTRL+S and then checking the scripts dashboard.
4. The script will automatically update itself and external dependencies. Verify that the script is working properly by navigating to a script-enabled page and checking for the red-orange footer.

# Current Scripts
|Script|Versions|Page Scope|Features|
|----------------|:------------:|------------------------|--------|
|Best Buy<br><br>Cart Saved items|[2.4.0](https://github.com/albert-sun/tamper-scripts/blob/bestbuy-cart_2.4.0/bestbuy-cart/script_main.js)<br>[2.5.X](https://github.com/albert-sun/tamper-scripts/blob/bestbuy-cart_2.5/bestbuy-cart/script_main.js)<br>[2.6.X](https://github.com/albert-sun/tamper-scripts/blob/bestbuy-cart_2.6/bestbuy-cart/script_main.js)|Cart page|<ul><li>Simple adblock detection and notification (having adblock sometimes messes with website functionality)<li>Automatic interval page reloading for refreshing availability on sold out or unavailable products</li><li>Keyword whitelist and blacklist for processing saved items (note that bundles aren't shown on the cart saved items display)</li></li>Automatic button clicking for initially entering product queue and when queue pops, along with audio notification whenever item is successfully added to cart</li></ul>|

# Changelog
Best Buy | Cart Saved Items v2.3.0 - Fixed resource and auto-update links, added new copy button for logging window, and updated icons  
Best Buy | Cart Saved Items v2.4.0 - Added cart auto page reload functionality and converted all images and audio to base64 to prevent hotlinking issues  
Best Buy | Cart Saved Items v2.5.0 - Moved some stuff around and made auto-refresh earlier, hopefully makes it work properly for more people  
Best Buy | Cart Saved Items v2.5.1 - Fixed setting auto-reload to 0 causing infinite page refresh loop  
Best Buy | Cart Saved Items v2.5.2 - Reduced number of color polling intervals from N to 1, hopefully helps with background timers
Best Buy | Cart Saved Items v2.6.0 - Removed adblock functionality, added blacklist and whitelist keyword setting, and fixed color interval leaking

# Frequently Asked Questions
**Q: Do scripts work on multiple / non-focused tabs?**  
A: The script automatically runs in the background regardless of whether the tab is currently being focused (unless the page has been unloaded from your browser) **as long as the page has been focused at least once.** This means that if you, for instance, opened a page using CTRL+CLICK or right clicked and selected "Open link in new tab", you would have to navigate to the tab once before clicking away.  

**Q: Can I run multiple scripts simultaneously?**  
A: Yes! All scripts should have different page scopes meaning you should never have multiple scripts running on a single page. However, their functions might overlap if you have multiple of the same tab open or are running two scripts with essentially overlapping functions (for example, both the Best Buy product page and cart scripts).  

**Q: How do I confirm that the script is running?**  
A: Two methods: you can either click the extension icon in the top right-hand corner of the browser and check that the script is enabled (no script shown means not installed) or check the bottom of the page for a red-orange banner showing the script information and status.  

**Q: Will you ever add auto-checkout?**  
A: I currently don't plan to implement script auto-checkout especially because of the massive advantage it would provide people who are AFK. Furthermore, auto-checkout sometimes requires typing in the CVV / receiving a verification code and that goes past the scope of privacy I'm comfortable with.  

# Notes
- Each script version will be hosted on a separate branch (but pulled to main for reference) to preserve backwards compatibility in case of API-breaking script updates.
- There is currently a forced refresh after initially clicking add buttons on the Best Buy cart script since the buttons would often-times not update properly.
- I am aware of autio not playing properly within previous versions of the script (usually those from the previous repository). The issue was because the website didn't like hot-linking and has since been resolved by hosting the file directly within the repository.
- There's currently a Zotac script in progress for basic features such as add link aggregation and concurrent adding. Best Buy product details script will also probably get an overhaul eventually but is on the lower end of my priorities list.
