$(function() {
  var url_val;

  var from_context = getQueryString();

  /**
   * 初期値のアクセストークン
   */
  var default_bitly_access_token = "ebd7a67d641fb54e4c84e2571369de37bbb79a12";

  /**
   * 利用するアクセストークン、最終的にユーザーの設定値か初期値のどちらかが入る
   */
  var use_bitly_access_token = "";

  /**
   * bitlyのドメイン名
   */
  var use_bitly_domain = "";

  chrome.storage.sync.get(
    {
      bitly_access_token: "",
      bitly_domain: "bit.ly",
      // 保存された値があったら使う
    },
    function(items) {
      if ("" != items.bitly_access_token.length) {
        console.log("[ Load ]", items.bitly_access_token);
        use_bitly_access_token = items.bitly_access_token;
      } else {
        console.log("[ NoLoad ]");
        use_bitly_access_token = default_bitly_access_token;
      }
      use_bitly_domain = items.bitly_domain;
    }
  );

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
    chrome.tabs.getSelected(null, function(tab) {
      const url = decodeURIComponent(tab.url);
      const title = tab.title;
      drawQr(url);
      $textarea.val(url);
      historySave(url, title);
    });
  } else {
    // historyから
    const url = decodeURIComponent(window.location.href);
    $("#qr").qrcode(url);
    $textarea.val(url);
  }

  //QRコードを拡大
  $(document).on("click", "#qr", function() {
    if (!$(".contets").hasClass("expansion")) {
      $(".contets").addClass("expansion");
    } else {
      $(".contets").removeClass("expansion");
    }
  });

  //キーボードでURLを修正した
  var timeoutid;
  $("textarea").on("keydown", function(e) {
    clearTimeout(timeoutid);
    timeoutid = setTimeout(function() {
      var str = $("textarea")
        .val()
        .toString();
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

  $("textarea").on("click", function(e) {
    $(this).addClass("click-open");
  });

  //元のURLに戻す
  $(".undo").on("click", function() {
    $("textarea").val(url_val);
    drawQr(encodeURI($("textarea").val()));
    $(".bitly").show();
    $(".undo").hide();
    $(".url").removeClass("bit-mode");

    $(".copy").hide();
  });

  //URLコピー
  $(".copy").on("click", function() {
    if (execCopy($("textarea").val())) {
      Problem("COPYED!");
    } else {
      Problem("COPY FAILURE!");
    }
  });

  //短縮URLにする
  $(".bitly").on("click", function() {
    // URLを取得し、url_val変数に代入
    url_val = $("textarea").val();

    // 結果を表示
    convertBitly(url_val).done(function(d) {
      if (d.data.url) {
        $(".bitly").hide();
        $(".undo").show();
        $(".copy").show();
        $(".url").addClass("bit-mode");

        $("textarea").val(d.data.url);
        drawQr(d.data.url);

        $("textarea")[0].select();
      } else {
        //短縮URL生成に失敗した場合の表示
        Problem(changeUnderbarToSpace(d.status_txt));
      }
    });
  });

  // 履歴表示ボタン
  $(".history").on("click", function() {
    $(".contets_inline").addClass("history");
    $(".history-list").show();
    $(".back").show();
    $(".history-clear").show();
    $(".option").show();
    historyListShow();
  });

  // 戻るボタン
  $(".back").on("click", function() {
    $(".contets_inline").removeClass("history");
  });

  // 履歴リスト
  $(document).on("click", ".history-list li", function() {
    var url_val = $(this).data("obj");
    $("textarea").val(url_val);
    drawQr(encodeURI($("textarea").val()));
    $(".contets_inline").removeClass("history");
  });

  // オプション表示ボタン
  $(".option").on("click", function() {
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
    $("#qr").qrcode(val);

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
   * "_" を " " に置き換え
   * @param {string} val
   */
  function changeUnderbarToSpace(val) {
    return val.replace(/_/g, " ");
  }

  /**
   * アラートを一定時間出して消す
   * @param {string} val
   */
  function Problem(val) {
    $(".alert")
      .html(val)
      .show();
    var timeoutid = setTimeout(function() {
      $(".alert").slideUp(400);
    }, 3000);
  }

  /**
   * Bitly APIにリクエスト
   * @param {string} url
   */
  function convertBitly(url) {
    var encUrl = encodeURIComponent(url);
    var bitly =
      "https://api-ssl.bitly.com/v3/shorten?access_token=" +
      use_bitly_access_token +
      "&longUrl=" +
      encUrl +
      "&domain=" +
      use_bitly_domain;

    var d = new $.Deferred();

    $.ajax({
      type: "get",
      url: bitly,
      dataType: "jsonp",
      processData: false,
      contentType: false,
      success: d.resolve,
      error: d.reject,
    });
    return d.promise();
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
        $(".history-list ul").append(
          '<li data-obj="' +
            historyListObj[item].url +
            '"><dl><dt>' +
            historyListObj[item].title +
            "</dt><dd>" +
            historyListObj[item].url +
            "</dd></dl></li>"
        );
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
