$(function () {
  var url_val;

  var from_context = getQueryString();

  $(".version").append(chrome.runtime.getManifest().version);

  //ロード時QR表示

  const $textarea = $("textarea");
  const $contets = $(".contets");
  const $body = $("body");
  if (from_context.url) {
    // contextから
    const url = from_context.url;
    const title = from_context.title;
    drawQr(url);
    $textarea.val(url);
    historySave(url, title);
    $contets.addClass("expansion");
    $body.addClass("context_mode");
  } else if (chrome.tabs) {
    // popから
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const url = decodeURIComponent(tabs[0].url);
      const title = tabs[0].title;
      drawQr(url);
      $textarea.val(url);
      historySave(url, title);
    });
  } else {
    // historyから
    const url = decodeURIComponent(window.location.href);
    $("#qr").qrcode({ width: 1000, height: 1000, text: url });
    // $("#qr").qrcode(url);
    $textarea.val(url);
  }

  //QRコードを拡大
  $(document).on("click", "#qr", function () {
    if (!$(".contets").hasClass("expansion")) {
      $(".contets").addClass("expansion");
    } else {
      $(".contets").removeClass("expansion");
    }
  });

  //キーボードでURLを修正した
  var timeoutid;
  $("textarea").on("keydown", function (e) {
    clearTimeout(timeoutid);
    timeoutid = setTimeout(function () {
      var str = $("textarea").val().toString();
      if (str.match(/[\u30a0-\u30ff\u3040-\u309f\u3005-\u3006\u30e0-\u9fcf]/)) {
        console.log("JP", str);
        str = Encoding.convert(str, "SJIS");
        drawQr(str);
      } else {
        console.log("EN", str);
        drawQr(encodeURI(str));
      }
      $(".copy").show();
    }, 300);
  });

  $("textarea").on("click", function (e) {
    $(this).addClass("click-open");
  });

  //元のURLに戻す
  $(".undo").on("click", function () {
    $("textarea").val(url_val);
    drawQr(encodeURI($("textarea").val()));
    $(".bitly").show();
    $(".undo").hide();
    $(".url").removeClass("bit-mode");

    $(".copy").hide();
  });

  //URLコピー
  $(".copy").on("click", function () {
    if (execCopy($("textarea").val())) {
      Problem("COPYED!");
    } else {
      Problem("COPY FAILURE!");
    }
  });

  // 履歴表示ボタン
  $(".history").on("click", function () {
    $(".contets_inline").addClass("history");
    $(".history-list").show();
    $(".back").show();
    $(".history-clear").show();
    $(".option").show();
    historyListShow();
  });

  // 戻るボタン
  $(".back").on("click", function () {
    $(".contets_inline").removeClass("history");
  });

  // 履歴リスト
  $(document).on("click", ".history-list li", function () {
    var url_val = $(this).data("obj");
    $("textarea").val(url_val);
    drawQr(encodeURI($("textarea").val()));
    $(".contets_inline").removeClass("history");
  });

  // オプション表示ボタン
  $(".option").on("click", function () {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL("options.html"));
    }
  });

  var ps = new PerfectScrollbar(".history-list", {
    // wheelSpeed: 2,
    // wheelPropagation: true,
    // minScrollbarLength: 20
  });

  /**
   * QRを描画
   * @param {string} val
   */
  function drawQr(val) {
    $("#qr").html("");
    $("#qr").qrcode({ width: 1000, height: 1000, text: val });

    //ドメインだけ取り出し
    var dluseurl = val.match(/^https?:\/{2,}(.*?)(?:\/|\?|#|$)/)[1];

    //画像ダウンロード用に変換
    var time = getDate();
    var imgData = $("canvas")[0].toDataURL();
    $(".download").attr("href", imgData);
    $(".download").attr("download", "qr-" + time + "-" + dluseurl + ".png");
  }

  /**
   * 日付取得
   */
  function getDate() {
    var dt = new Date();
    var year = dt.getFullYear().toString();
    var month = (dt.getMonth() + 1).toString();
    var date = dt.getDate().toString();
    var hours = dt.getHours().toString();
    var minutes = dt.getMinutes().toString();
    var seconds = dt.getSeconds().toString();
    return year + month + date + hours + minutes + seconds;
  }

  /**
   * フォームの内容をクリップボードにコピー
   * @param {string} string
   */
  function execCopy(string) {
    // 空div 生成
    var tmp = document.createElement("div");
    // 選択用のタグ生成
    var pre = document.createElement("pre");

    // 親要素のCSSで user-select: none だとコピーできないので書き換える
    pre.style.webkitUserSelect = "auto";
    pre.style.userSelect = "auto";

    tmp.appendChild(pre).textContent = string;

    // 要素を画面外へ
    var s = tmp.style;
    s.position = "fixed";
    s.right = "200%";

    // body に追加
    document.body.appendChild(tmp);
    // 要素を選択
    document.getSelection().selectAllChildren(tmp);

    // クリップボードにコピー
    var result = document.execCommand("copy");

    // 要素削除
    document.body.removeChild(tmp);

    return result;
  }

  /**
   * アラートを一定時間出して消す
   * @param {string} val
   */
  function Problem(val) {
    $(".alert").html(val).show();
    var timeoutid = setTimeout(function () {
      $(".alert").slideUp(400);
    }, 3000);
  }

  /**
   * 履歴を表示
   */
  function historyListShow() {
    var historyListObj = histryLoad();
    historyListObj.reverse();
    if (historyListObj) {
      $(".history-list ul").html("");
      for (var item in historyListObj) {
        $(".history-list ul").append('<li data-obj="' + historyListObj[item].url + '"><dl><dt>' + historyListObj[item].title + "</dt><dd>" + historyListObj[item].url + "</dd></dl></li>");
      }
    }
  }

  /**
   * ローカルストレージから履歴をロードする
   * @return {object} 履歴の配列
   */
  function histryLoad() {
    var getjson = localStorage.getItem("qrcodeextensions12345");
    if (getjson) {
      var historyListObj = JSON.parse(getjson);
      console.log(historyListObj);
      return historyListObj;
    } else {
      return false;
    }
  }

  /**
   * ローカルストレージに履歴を保存する
   * @param {string} url
   * @param {string} title
   */
  function historySave(url, title) {
    var historyListObj = histryLoad();
    var array = [];
    console.log("historyListObj", historyListObj);
    var sameURL = false;
    if (historyListObj) {
      for (var item in historyListObj) {
        array.push({
          url: historyListObj[item].url,
          title: historyListObj[item].title,
          date: historyListObj[item].date,
        });
        if (url == historyListObj[item].url) {
          sameURL = true;
        }
      }
    }
    if (!sameURL) {
      array.push({
        url: url,
        title: title,
        date: new Date(),
      });
    }
    if (30 < array.length) {
      array.shift();
    }
    var setjson = JSON.stringify(array);
    localStorage.setItem("qrcodeextensions12345", setjson);
  }

  /**
   * クエリストリング（URLパラメータ）をパースして返す
   * @returns {Object} `{name: value, ...}`にパースする
   */
  function getQueryString() {
    let result = {};

    if (1 < document.location.search.length) {
      let query = document.location.search.substring(1);
      let parameters = query.split("&");

      for (let i = 0, len = parameters.length; i < len; i++) {
        let element = parameters[i].split("=");
        let paramName = decodeURIComponent(element[0]);
        let paramValue = decodeURIComponent(element[1]);
        result[paramName] = decodeURIComponent(paramValue);
      }
    }
    return result;
  }
});
