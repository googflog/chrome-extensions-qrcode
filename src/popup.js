$(function() {
  var url_val;
  
  //ロード時QR表示
  if(chrome.tabs){
    chrome.tabs.getSelected(null, function(tab) {
      drawQr(tab.url);
      $('textarea').val(decodeURI(tab.url));
      historySave($('textarea').val())
    });
  }else{
    $('#qr').qrcode(window.location.href);
    $('textarea').val(decodeURI(window.location.href));
  }


  //QRを描画
  function drawQr(val) {
    $('#qr').html('');
    $('#qr').qrcode(val);
    
    //ドメインだけ取り出し
    var dluseurl = val.match(/^https?:\/{2,}(.*?)(?:\/|\?|#|$)/)[1];
    
    //画像ダウンロード用に変換
    var time = getDate();
    var imgData = $('canvas')[0].toDataURL();
    $('.download').attr('href', imgData);
    $('.download').attr('download', 'qr-' + time + '-' + dluseurl + '.png');
  }

  //QRコードを拡大
  $(document).on('click', '#qr', function() {
    if (!$(this).hasClass('expansion')) {
      $(this).addClass('expansion');
    } else {
      $(this).removeClass('expansion');
    }
  })
  
  //日付取得
  function getDate(){
    var dt = new Date();
    var year = dt.getFullYear().toString();
    var month = (dt.getMonth() + 1).toString();
    var date = dt.getDate().toString();
    var hours = dt.getHours().toString();
    var minutes = dt.getMinutes().toString();
    var seconds = dt.getSeconds().toString();
    return year + month + date + hours + minutes + seconds;
  }

  //キーボードでURLを修正した
  var timeoutid;
  $('textarea').on('keydown', function(e) {
    clearTimeout(timeoutid)
    timeoutid = setTimeout(function() {
      drawQr(encodeURI($('textarea').val()));
      $('.copy').show();
    }, 300);
  });
  $('textarea').on('click', function(e) {
    $(this).addClass("click-open");
  });

  //元のURLに戻す
  $('.undo').on("click", function() {
    $('textarea').val(url_val);
    drawQr(encodeURI($('textarea').val()));
    $('.bitly').show();
    $('.undo').hide();
    $('.copy').hide();
    $('.url').removeClass('bit-mode');
  })

  //URLコピー
  $('.copy').on("click", function() {
    execCopy();
  })
  function execCopy(string) {
    $('textarea').focus();
    $('textarea').select();
    // // クリップボードにコピーします。
    var succeeded = document.execCommand('copy');
    if (succeeded) {
      // コピーに成功した場合の処理です。
      console.log('コピーが成功しました！');
    } else {
      // コピーに失敗した場合の処理です。
      console.log('コピーが失敗しました!');
    }
  }


  //短縮URLにする
  $('.bitly').on("click", function() {
    // URLを取得し、url_val変数に代入
    url_val = $('textarea').val();
    // 短縮URL用ドメインを取得し、domain_val変数に代入
    var domain_val = 'bit.ly';

    // 結果を表示
    convertBitly(url_val, domain_val).done(function(d) {
      $('.bitly').hide();
      $('.undo').show();
      $('.copy').show();
      $('.url').addClass('bit-mode');
      if (d.data.url) {
        $('textarea').val(d.data.url);
        drawQr(d.data.url);

        // $('textarea')[0].focus();
        $('textarea')[0].select();
      }
    });
  });

  // Bitly APIにリクエスト
  function convertBitly(url, domain) {
    var encUrl = encodeURIComponent(url);
    var bitly = "https://api-ssl.bitly.com/v3/shorten?access_token=f21eaf9abcfe1d1edfa78193041439c80db743bc&longUrl=" + encUrl + "&domain=" + domain;

    var d = new $.Deferred();

    $.ajax({
      type: "get",
      url: bitly,
      dataType: "jsonp",
      processData: false,
      contentType: false,
      success: d.resolve,
      error: d.reject
    });
    return d.promise();
  }

  //履歴
  $('.history').on("click", function() {
    historyListShow();
  });
  $('.back').on("click", function() {
    $('.history-list').hide();
    $('.back').hide();
    $('.history-clear').hide();
    $('.history').show();
    $('.qr').show();
    $('.textarea').show();
    $('.bitly').show();
  });
  $(document).on('click', '.history-list li', function() {
    $('.history-list').hide();
    $('.back').hide();
    $('.history-clear').hide();
    $('.history').show();
    $('.qr').show();
    $('.textarea').show();
    $('.bitly').show();
    $('.copy').show();
    var url_val = $(this).data('obj');
    $('textarea').val(url_val);
    drawQr(encodeURI($('textarea').val()));
  })

  $('.history-clear').on("click", function() {
    localStorage.removeItem('qrqrqrqr');
    $('.history-list ul').html('');
  })

  function historyListShow() {
    $('.history-list').show();
    $('.back').show();
    $('.history-clear').show();
    $('.history').hide();
    $('.qr').hide();
    $('.textarea').hide();
    $('.bitly').hide();
    $('.copy').hide();
    var historyListObj = histryLoad();
    historyListObj.reverse();
    if (historyListObj) {
      $('.history-list ul').html('');
      for (var item in historyListObj) {
        $('.history-list ul').append('<li data-obj="' + historyListObj[item] + '">' + historyListObj[item] + '</li>')
      }
    }
  }
  
  
  function histryLoad() {
    var getjson = localStorage.getItem('qrqrqrqr');
    if (getjson) {
      var historyListObj = JSON.parse(getjson);
      console.log(historyListObj);
      return historyListObj;
    } else {
      return false;
    }
  }

  function historySave(str) {
    var historyListObj = histryLoad();
    var array = [];
    console.log("historyListObj", historyListObj)
    var sameURL = false;
    if (historyListObj) {
      console.log("historyListObj", historyListObj)
      for (var item in historyListObj) {
        array.push(historyListObj[item]);
        if (str == historyListObj[item]) {
          sameURL = true;
        }
      }
    }
    if (!sameURL) {
      array.push(str);
    }
    if (30 < array.length) {
      array.shift();
    }
    var setjson = JSON.stringify(array);
    localStorage.setItem('qrqrqrqr', setjson);
  }









})