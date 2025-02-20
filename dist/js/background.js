"use strict";

// Chrome拡張機能の背景スクリプト
// このスクリプトはコンテキストメニューの生成と、クリック時の動作を管理しています。

// コンテキストメニューを作成
chrome.contextMenus.create({
  id: "create_qr_context", // このメニュー項目を識別するための一意なID
  title: chrome.i18n.getMessage("create_qr_context"), // 国際化対応のタイトルを取得し設定
  type: "normal", // 通常のアイテムタイプ
  contexts: ["all"], // 全てのコンテキスト（ページ全体、リンク上など）で表示される
});

// コンテキストメニューがクリックされたときのイベントリスナーを設定
chrome.contextMenus.onClicked.addListener(function (info) {
  // QRコードを表示するポップアップ用のHTMLファイル
  var url = "popup.html";

  // もしユーザーがリンク上で右クリックしメニューを選択した場合は、
  // info.linkUrlにリンク先のURLが含まれます。
  if (info.linkUrl) {
    // リンクURLと、選択したテキストをURIエンコードしてクエリパラメータに利用
    const encode_url = encodeURIComponent(info.linkUrl);
    const encode_title = encodeURIComponent(info.selectionText);

    // 新しいタブを開いて、popup.htmlにエンコード済みのタイトルとURLを渡す
    chrome.tabs.create({
      url: url + "?title=" + encode_title + "&url=" + encode_url,
    });
  } else {
    // リンク上でなかった場合、現在アクティブなタブの情報からURLとタイトルを取得
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      // タブの先頭（現在表示中のタブ）のURLとタイトルをエンコード
      const encode_url = encodeURIComponent(tabs[0].url);
      const encode_title = encodeURIComponent(tabs[0].title);

      // 新しいタブを開いて、popup.htmlにエンコード済みの情報をパラメータとして渡す
      chrome.tabs.create({
        url: url + "?title=" + encode_title + "&url=" + encode_url,
      });
    });
  }
});
