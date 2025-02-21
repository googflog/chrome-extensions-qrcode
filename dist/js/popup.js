$(function () {
  var url_val;

  var from_context = getQueryString();

  $(".version").append(chrome.runtime.getManifest().version);

  //ロード時QR表示

  const $textarea = $(".url-textarea");
  const $contets = $(".contets");
  const $body = $("body");
  if (from_context.url) {
    // contextから
    const url = from_context.url;
    const title = from_context.title;
    drawQr(url);
    $textarea.val(url);
    historySave(url, title);
    $contets.addClass("is-expansion");
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
    $("#qrcode").qrcode({ width: 1000, height: 1000, text: url });
    // $("#qrcode").qrcode(url);
    $textarea.val(url);
  }

  //QRコードを拡大
  $(document).on("click", "#qrcode", function () {
    if (!$(".contets").hasClass("is-expansion")) {
      $(".contets").addClass("is-expansion");
    } else {
      $(".contets").removeClass("is-expansion");
    }
  });

  //キーボードでURLを修正した
  var timeoutid;
  $(".url-textarea").on("keydown", function (e) {
    clearTimeout(timeoutid);
    timeoutid = setTimeout(function () {
      var str = $(".url-textarea").val().toString();
      if (str.match(/[\u30a0-\u30ff\u3040-\u309f\u3005-\u3006\u30e0-\u9fcf]/)) {
        console.log("JP", str);
        str = Encoding.convert(str, "SJIS");
        drawQr(str);
      } else {
        console.log("EN", str);
        drawQr(encodeURI(str));
      }
    }, 300);
  });

  $(".url-textarea").on("click", function (e) {
    $(this).addClass("click-open");
  });

  // 履歴表示ボタン
  $(".button[data-type='history']").on("click", function () {
    $(".contets-inline").addClass("is-history");
    $(".history-list").show();
    $(".back-button").show();
    $(".history-clear").show();
    $(".option").show();
    historyListShow();
  });

  // 戻るボタン
  $(".button[data-type='back']").on("click", function () {
    $(".contets-inline").removeClass("is-history");
  });

  // 履歴リスト
  $(document).on("click", ".history-list li", function () {
    var url_val = $(this).data("obj");
    $(".url-textarea").val(url_val);
    drawQr(encodeURI($(".url-textarea").val()));
    $(".contets-inline").removeClass("is-history");
  });

  // オプション表示ボタン
  $(".option").on("click", function () {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL("options.html"));
    }
  });

  new PerfectScrollbar(".history-list");

  /**
   * QRを描画
   * @param {string} val
   */
  function drawQr(val) {
    $("#qrcode").html("");
    $("#qrcode").qrcode({ width: 1000, height: 1000, text: val });

    //ドメインだけ取り出し
    const urlToValidFilename = val.match(/^https?:\/{2,}(.*?)(?:\/|\?|#|$)/)[1].replace(/\./g, "_");

    //画像ダウンロード用に変換
    const time = getDate();
    //画像データを取得
    const imgData = $("canvas")[0].toDataURL();

    $(".button[data-type='download']").attr("href", imgData);
    $(".button[data-type='download']").attr("download", "qr_" + time + "_" + urlToValidFilename + ".png");
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
