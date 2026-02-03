function extractHostname(url) {
      var hostname;
      //find & remove protocol (http, ftp, etc.) and get hostname

      if (url.indexOf("//") > -1) {
            hostname = url.split('/')[2];
      } else {
            hostname = url.split('/')[0];
      }

      //find & remove port number
      hostname = hostname.split(':')[0];
      //find & remove "?"
      hostname = hostname.split('?')[0];

      return hostname;
}

// To address those who want the "root domain," use this function:
function extractRootDomain(url) {
      var domain = extractHostname(url),
              splitArr = domain.split('.'),
              arrLen = splitArr.length;

      //extracting the root domain here
      //if there is a subdomain 
      if (arrLen > 2) {
            domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
            //check to see if it's using a Country Code Top Level Domain (ccTLD) (i.e. ".me.uk")
            if (splitArr[arrLen - 2].length == 2 && splitArr[arrLen - 1].length == 2) {
                  //this is using a ccTLD
                  domain = splitArr[arrLen - 3] + '.' + domain;
            }
      }
      return domain;
}
function go_to_google_with_id(ID) {
      //If is CID
      if (ID == parseInt(ID, 10) && ID.length > 15 && ID.length < 25) {
            chrome.tabs.create({'url': "https://www.google.com/maps?cid=" + ID.trim()}, function (tab) {});
      } else {
            var placeId = ID.startsWith("ChI");
            var kgG = ID.startsWith("/g/");
            var kgM = ID.startsWith("/m/");
            if (placeId) {
                  //If is Place ID ( starts with 'ChI' )
                  chrome.tabs.create({'url': "https://www.google.com/maps/place/?q=place_id:" + ID.trim()}, function (tab) {});
            } else if (kgG || kgM) {
                  chrome.tabs.create({'url': "https://g.co/kg" + ID.trim()}, function (tab) {});
            }
      }

}
// The onClicked callback function.
function onClickHandler(info, tab) {

      if (info.menuItemId.indexOf("sls") == 0) {
            go_to_google_with_id(info.selectionText);
            return;
      }

      //Link URL
      if (!info.linkUrl) {
            var newURL = info.pageUrl;
      } else {
            //Page URL
            var newURL = info.linkUrl;
      }

      //Root Domain
      if (info.menuItemId.indexOf("domain") != -1) {
            var newURL = extractRootDomain(newURL);
      }



      if (info.menuItemId.indexOf("showpid:") == 0) {
            chrome.scripting.executeScript({
                  target: {tabId: tab.id, allFrames: true},
                  files: ['includes/show_pid_fid.js'],
            });
      } else if (info.menuItemId.indexOf("site:") == 0) {
            var newTabURL = 'https://www.google.com/search?q=site:' + encodeURIComponent(newURL);
      } else if (info.menuItemId.indexOf("cache:") == 0) {
            var newTabURL = 'https://www.google.com/search?q=cache:' + encodeURIComponent(newURL);
      } else if (info.menuItemId.indexOf("speed:") == 0) {
            var newTabURL = 'https://developers.google.com/speed/pagespeed/insights/?url=' + encodeURIComponent(newURL);
      } else if (info.menuItemId.indexOf("mobile:") == 0) {
            var newTabURL = 'https://www.google.com/webmasters/tools/mobile-friendly/?url=' + encodeURIComponent(newURL);
      } else if (info.menuItemId.indexOf("structured:") == 0) {
            var newTabURL = 'https://validator.schema.org/?url=' + encodeURIComponent(newURL);
      } else if (info.menuItemId.indexOf("richsnippet:") == 0) {
            var newTabURL = 'https://search.google.com/test/rich-results?url=' + encodeURIComponent(newURL);
      } else if (info.menuItemId.indexOf("nearby:") == 0) {
            chrome.scripting.executeScript({
                  target: {tabId: tab.id, allFrames: true},
                  files: ['includes/near_by_search.js'],
            });
      } else if (info.menuItemId.indexOf("serpstat:") == 0) {
            var newTabURL = 'https://pleper.com/tools/serpstats.php?url=' + encodeURIComponent(newURL);
      } else if (info.menuItemId.indexOf("headertest:") == 0) {
            var newTabURL = 'https://pleper.com/index.php?do=tools&sdo=http_headers&url=' + encodeURIComponent(newURL);
      } else if (info.menuItemId.indexOf("knowledge:") == 0) {
            var newTabURL = 'https://pleper.com/tools/bookmarklet_redir.php?redir=kw&url=' + encodeURIComponent(newURL);
      } else if (info.menuItemId.indexOf("gtomaps:") == 0) {
            chrome.scripting.executeScript(tab.id, {file: 'includes/open_maps.js'});
            //var newTabURL = 'https://pleper.com/tools/bookmarklet_redir.php?redir=maps&url=' + encodeURIComponent(newURL);
      } else if (info.menuItemId.indexOf("cid:") == 0) {
            var newTabURL = 'https://pleper.com/index.php?do=tools&sdo=cid_converter&url=' + encodeURIComponent(newURL);
      } else if (info.menuItemId.indexOf("addplp:") == 0) {
            chrome.scripting.executeScript({
                  target: {tabId: tab.id, allFrames: false},
                  files: ['includes/add_to_pleper.js'],
            });
      } else if (info.menuItemId.indexOf("gposta:") == 0) {
            chrome.scripting.executeScript({
                  target: {tabId: tab.id, allFrames: false},
                  files: ['includes/analyze_posts.js'],
            });
      } else if (info.menuItemId.indexOf("wasave:") == 0) {
            var newTabURL = 'https://web.archive.org/save/' + info.pageUrl;
      } else if (info.menuItemId.indexOf("wacheck:") == 0) {
            var newTabURL = 'https://web.archive.org/web/20551209001520/' + info.pageUrl;
      } else if (info.menuItemId.indexOf("maps_kg:") == 0) {
            chrome.scripting.executeScript({
                  target: {tabId: tab.id, allFrames: true},
                  files: ['includes/open_maps.js'],
            });
      } else if (info.menuItemId.indexOf("listinginfo:") == 0) {
            chrome.scripting.executeScript({
                  target: {tabId: tab.id, allFrames: true},
                  files: ['includes/send_post_request.js'],
            });
            return;
      }

      //Open new tab after current
      if (newTabURL) {
            chrome.tabs.query(
                    {active: true, currentWindow: true},
                    tabs => {
                          let index = tabs[0].index;
                          chrome.tabs.create({url: newTabURL, index: index + 1, });
                    }
            );
      }
}

function build_context_menu() {
      if (chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
      }
      chrome.contextMenus.removeAll();

      chrome.contextMenus.create({"title": "Get Listing Info", "contexts": ["all"], "id": "listinginfo:"});

      var titlePrefix = 'Domain';
      var idSufix = '_domain';
      var context = 'all';
      chrome.contextMenus.create({"title": "SerpStat Domain Info", "contexts": [context], "id": "serpstat:" + idSufix});
      chrome.contextMenus.create({"title": "Google Near By Search (CTRL+ALR+R)", "contexts": [context], "id": "nearby:" + idSufix});
      chrome.contextMenus.create({"title": "Show Place ID | FID", "contexts": [context], "id": "showpid:" + idSufix});
      //chrome.contextMenus.create({"type": "separator", "contexts": ['all'], "id": "sp0"});
      chrome.contextMenus.create({"type": "separator", "id": "sep0"});

      var titlePrefix = 'Other';
      var idSufix = '_other';
      var context = 'all';
      chrome.contextMenus.create({"title": "Add To PlePer", "contexts": [context], "id": "addplp:" + idSufix});
      chrome.contextMenus.create({"title": "Go To Maps", "contexts": [context], "id": "gtomaps:" + idSufix});
      chrome.contextMenus.create({"title": "Go To Knowledge Graph", "contexts": [context], "id": "knowledge:" + idSufix});
      chrome.contextMenus.create({"title": "Go To CID Converter", "contexts": [context], "id": "cid:" + idSufix});
      //chrome.contextMenus.create({"title": "Go To Post Analyzer", "contexts": [context], "id": "gposta:" + idSufix});
      chrome.contextMenus.create({title: "Go to Google with ID: %s", id: 'sls', contexts: ['selection']});
      chrome.contextMenus.create({"type": "separator", "contexts": ['all'], "id": "sp1"});


      // Create one item for each context type.
      // [all, page, frame, selection, link, editable, image, video, audio, launcher, browser_action, page_action]
      var contexts = ["link", "page"];

      for (var i = 0; i < contexts.length; i++) {
            var context = contexts[i];
            var idSufix = "_" + context;

            if (context == 'page') {
                  var titlePrefix = 'Page';
            } else {
                  var titlePrefix = 'Link';
            }
            var parent_id = 'fl' + context;

            chrome.contextMenus.create({"title": titlePrefix, "contexts": [context], "id": parent_id});
            chrome.contextMenus.create({"title": titlePrefix + " Site:", "contexts": [context], "id": "site:" + idSufix, "parentId": parent_id});
            chrome.contextMenus.create({"title": titlePrefix + " Cache:", "contexts": [context], "id": "cache:" + idSufix, "parentId": parent_id});
            chrome.contextMenus.create({"title": titlePrefix + " SpeedTest:", "contexts": [context], "id": "speed:" + idSufix, "parentId": parent_id});
            chrome.contextMenus.create({"title": titlePrefix + " Mobile Friendly:", "contexts": [context], "id": "mobile:" + idSufix, "parentId": parent_id});
            chrome.contextMenus.create({"title": titlePrefix + " Structured Data:", "contexts": [context], "id": "structured:" + idSufix, "parentId": parent_id});
            chrome.contextMenus.create({"title": titlePrefix + " Rich Results:", "contexts": [context], "id": "richsnippet:" + idSufix, "parentId": parent_id});
            chrome.contextMenus.create({"title": titlePrefix + " SerpStat Info:", "contexts": [context], "id": "serpstat:" + idSufix, "parentId": parent_id});
            //chrome.contextMenus.create({"title": titlePrefix + " HTTP Header Test:", "contexts": [context], "id": "headertest:" + idSufix, "parentId": parent_id});
      }


      var titlePrefix = 'Domain';
      var idSufix = '_domain';
      var context = 'all';

      chrome.contextMenus.create({"title": "Domain:", "contexts": [context], "id": "flDomain"});
      chrome.contextMenus.create({"title": titlePrefix + " Site:", "contexts": [context], "id": "site:" + idSufix, "parentId": "flDomain"});
      chrome.contextMenus.create({"title": titlePrefix + " Cache:", "contexts": [context], "id": "cache:" + idSufix, "parentId": "flDomain"});
      chrome.contextMenus.create({"title": titlePrefix + " SpeedTest:", "contexts": [context], "id": "speed:" + idSufix, "parentId": "flDomain"});
      chrome.contextMenus.create({"title": titlePrefix + " Mobile Friendly:", "contexts": [context], "id": "mobile:" + idSufix, "parentId": "flDomain"});
      chrome.contextMenus.create({"title": titlePrefix + " Structured Data:", "contexts": [context], "id": "structured:" + idSufix, "parentId": "flDomain"});
      chrome.contextMenus.create({"title": titlePrefix + " Rich Results:", "contexts": [context], "id": "richsnippet:" + idSufix, "parentId": "flDomain"});
      //chrome.contextMenus.create({"title": titlePrefix + " HTTP Header Test:", "contexts": [context], "id": "headertest:" + idSufix, "parentId": "flDomain"});
      chrome.contextMenus.create({"title": "Web Archive", "contexts": [context], "id": "webArchive"});
      chrome.contextMenus.create({"title": "Web Archive Save This Page", "contexts": [context], "id": "wasave:" + idSufix, "parentId": "webArchive"});
      chrome.contextMenus.create({"title": "Web Archive Check This Page", "contexts": [context], "id": "wacheck:" + idSufix, "parentId": "webArchive"});



      chrome.storage.sync.get(['removedContextMenu'], function (list) {
            if (list.removedContextMenu) {
                  var removed = list.removedContextMenu;

                  if (removed.length > 0) {
                        for (var i = 0; i < removed.length; i++) {
                              var toRemove = removed[i];
                              if (toRemove.includes(":")) {
                                    chrome.contextMenus.remove(removed[i]);
                              }
                        }
                  }
            }
      });

      if (chrome.extension.lastError) {
            console.log("Got unexpected error: " + chrome.extension.lastError.message);
      }
      if (chrome.runtime.lastError) {
            console.log("Got unexpected error: " + chrome.extension.runtime.message);
      }

}

chrome.contextMenus.onClicked.addListener(onClickHandler);

// Set up context menu tree at install time.
chrome.runtime.onInstalled.addListener(function () {
      build_context_menu();
});

// Set up context menu tree at change settings.
chrome.storage.onChanged.addListener(function () {
      build_context_menu();
});

setTimeout(function () {
      build_context_menu();
}
, 222);