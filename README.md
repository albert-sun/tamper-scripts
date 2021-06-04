# Tampermonkey Userscripts
{ [Installation](<https://github.com/albert-sun/tamper-scripts#Installation>) | [Current Scripts](<https://github.com/albert-sun/tamper-scripts#Current-Scripts>) | [Changelog](<https://github.com/albert-sun/tamper-scripts#Changelog>) | [Frequently Asked Question](<https://github.com/albert-sun/tamper-scripts#Frequently-Asked-Questions>) | [Notes](<https://github.com/albert-sun/tamper-scripts#Notes>) }

A collection (currently just one though) of Tampermonkey userscripts primarily centered around queue automation. All scripts come with a user interface for logging, settings. etc. For script support, please provide me with the script used, version, page URL, logging output (if applicable), and detailed description of the issue.

⚠️ **DO NOT download anything straight from the main branch as it could be outdated (I only pull request major and minor script versions)**.⚠️  

[Join the Discord server](<https://discord.com/channels/767566223729754122/847824352647970826/849044131509829722>)  
**Twitch (direct message):** AkitoApocalypse  
[Donate via PayPal](<https://www.paypal.com/donate?business=GFVTB9U2UGDL6&currency_code=USD>) | 1KgcytPHXNwboNbXUN3ZyuASDZWt8Qcf1t | 0xAf9EB617c81B050517E9A8826E4c93DcC182AeaD

# Installation  
1. Install the TamperMonkey extension for Chrome / derivates or Firefox.
2. Copy the source for **only the main script** linked within [Current Scripts](<https://github.com/albert-sun/tamper-scripts#Current-Scripts>) and paste it into Tampermonkey as a new userscript. Ensure that the script is properly saved afterwards. **For versions 3.2.X and above, you only have to click "3.2.X" in the versions table below and it should automatically open a new tab for installation.**  
3. Verify that the script is working properly by navigating to a script-enabled page and checking for the red-orange footer.

# Current Scripts
|Script|Versions|Page Scope|Features|
|----------------|:------------:|------------------------|--------|
|**Best Buy**<br>Cart Saved Items Automation|[2.4.0](https://github.com/albert-sun/tamper-scripts/blob/bestbuy-cart_2.4.0/bestbuy-cart/script_main.js)<br>[2.5.X](https://github.com/albert-sun/tamper-scripts/blob/bestbuy-cart_2.5/bestbuy-cart/script_main.js)<br>[2.6.X](https://github.com/albert-sun/tamper-scripts/blob/bestbuy-cart_2.6/bestbuy-cart/script_main.js)<br>[3.0.X](https://github.com/albert-sun/tamper-scripts/blob/bestbuy-cart_3.0/bestbuy-cart/script_main.js)<br>[3.1.X](https://github.com/albert-sun/tamper-scripts/blob/bestbuy-cart_3.1/bestbuy-cart/script_main.js)<br>[3.2.X](https://raw.githubusercontent.com/albert-sun/tamper-scripts/bestbuy-cart_3.2/bestbuy-cart/script_main.user.js)|Cart page<br><br>**NOT THE SAVED ITEMS PAGE**|<ul><li>~~Simple adblock detection and notification (having adblock sometimes messes with website functionality)<li>Automatic interval page reloading for refreshing availability on sold out or unavailable products~~</li><li>Keyword whitelist, keyword blacklist, and SKU whitelist for processing saved items (note that bundles aren't shown on the cart saved items display, sorry!)</li><li>Automatic add-to-cart button clicking when available along with audio notification whenever item is successfully added to cart</li></ul>|

# Changelog
**Best Buy | Cart Saved Items Automation v3.0.2** - Added extra Ti (tie) keywords for 3070Ti and 3080Ti and made keyword checks non case-sensitive  
**Best Buy | Cart Saved Items Automation v3.0.3** - Fixed the keyword whitelisting so they would work properly (forgot to lowercase keywords)  
**Best Buy | Cart Saved Items Automation v3.1.0** - Re-added auto refreshing (use at your own risk) and fixed notify sound not playing  
**Best Buy | Cart Saved Items Automation v3.1.1** - Fixed the lineItems error showing on script load, confirmed it wasn't important anyway  
**Best Buy | Cart Saved Items Automation v3.2.0** - Created new branch, changed script name for auto Tampermonkey installation (nice)  
**Best Buy | Cart Saved Items Automation v3.2.1** - Fixed infinite page reloading when something was inside the cart  
**Best Buy | Cart Saved Items Automation v3.2.2** - Added logging when items are not tracked because of whitelist / blacklist

# Frequently Asked Questions
**Q: Do scripts work on multiple / non-focused tabs?**  
A: The script automatically runs in the background regardless of whether the tab is currently being focused (unless the page has been unloaded from your browser) **as long as the page has been focused at least once.** This means that if you, for instance, opened a page using CTRL+CLICK or right clicked and selected "Open link in new tab", you would have to navigate to the tab once before clicking away.  

**Q: Can I run multiple scripts simultaneously?**  
A: Yes! All scripts should have different page scopes meaning you should never have multiple scripts running on a single page. However, their functions might overlap if you have multiple of the same tab open or are running two scripts with essentially overlapping functions (for example, both the Best Buy product page and cart scripts).  

**Q: How do I confirm that the script is running?**  
A: Two methods: you can either click the extension icon in the top right-hand corner of the browser and check that the script is enabled (no script shown means not installed) or check the bottom of the page for a red-orange banner showing the script information and status.  

**Q: Does the script work for in-store selectors?**  
A: Unfortunately, I can't make the script effectively work for in-store selection. You might come across a bug where the script auto-clicks the add-to-cart button and the in-store selector popup shows - unfortunately, I'm not currently sure how to avoid that.  

**Q: Will you ever add auto-checkout?**  
A: I currently don't plan to implement auto-checkout within the script since it would encourage AFKing during drops. Furthermore, auto-checkout sometimes requires typing in the CVV / receiving a verification code and that poses a massive privacy / security risk I'm not willing to deal with.  

# Notes 
I've deprecated the auto-reload functionality since it was being finicky under Chrome's low-usage mode (triggered when tabs are unfocused). I would suggest using an extension like [Distill](https://chrome.google.com/webstore/detail/distill-web-monitor/inlikjemeeknofckkjolnjbpehgadgge?hl=en) instead for auto-reloading.
