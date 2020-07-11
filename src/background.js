chrome.contextMenus.create({
  title: chrome.i18n.getMessage("create_qr_context"),
  type: "normal",
  contexts: ["all"],
  onclick: function(info) {
    var url = "popup.html";

    //リンク上でcontextを展開していた場合
    if (info.linkUrl) {
      const encode_url = encodeURIComponent(info.linkUrl);
      const encode_title = encodeURIComponent(info.selectionText);
      chrome.tabs.create({
        url: url + "?title=" + encode_title + "&url=" + encode_url,
      });
    } else {
      chrome.tabs.getSelected(null, function(tab) {
        const encode_url = encodeURIComponent(tab.url);
        const encode_title = encodeURIComponent(tab.title);
        chrome.tabs.create({
          url: url + "?title=" + encode_title + "&url=" + encode_url,
        });
      });
    }
  },
});
