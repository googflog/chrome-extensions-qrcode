$(function() {

    var default_bitly_access_token = 'ebd7a67d641fb54e4c84e2571369de37bbb79a12';

    $(".version").append(chrome.runtime.getManifest().version);

    $('#bitly_access_token').on('keyup', function() {

        console.log("[ Save ]", $(this).val());

        var temp_bitly_access_token = '';
        if ('' != $(this).val()) {
          temp_bitly_access_token = $(this).val();
        }
        chrome.storage.sync.set({
            bitly_access_token: temp_bitly_access_token
        }, function() {
            // 保存できたら、画面にメッセージを表示
        });
    })

    $('[value="bit.ly"]').on('click', function() {
        console.log("[ Save ]", $(this).val());
        chrome.storage.sync.set({
            bitly_domain: $(this).val()
        });
    });
    $('[value="j.mp"]').on('click', function() {
        console.log("[ Save ]", $(this).val());
        chrome.storage.sync.set({
            bitly_domain: $(this).val()
        });
    });
    $('[value="bitly.com"]').on('click', function() {
        console.log("[ Save ]", $(this).val());
        chrome.storage.sync.set({
            bitly_domain: $(this).val()
        });
    });

    // 設定画面で設定を表示する
    function restore_options() {
        console.log("restore_options", restore_options);
        // デフォルト値は、ここで設定する
        chrome.storage.sync.get({
            bitly_access_token: '',
            bitly_domain: 'bit.ly'
        }, function(items) {
          // 保存された値があったら、それを使う

          if('' != items.bitly_access_token.length){
            console.log("[ Load ]", items.bitly_access_token);
            $('#bitly_access_token')[0].value = items.bitly_access_token;
          }else{
            $('#bitly_access_token')[0].value = '';
          }
          $('[value="'+items.bitly_domain+'"]')[0].checked = 'checked';

            // $('#bitly_access_token').value = items.bitly_access_token;
            // $('#bitly_domain').value = items.bitly_domain;
        });
    }


    restore_options();


    if(!histryLoad()){
      $('.history-clear').attr('disabled',true);
    }
    console.log(localStorage.getItem('qrcodeextensions12345'));
    //
    $('.history-clear').on("click", function() {
      localStorage.removeItem('qrcodeextensions12345');
      $('.history-list ul').html('');
      $('.history-clear').attr('disabled',true);
    })


    function histryLoad() {
      var getjson = localStorage.getItem('qrcodeextensions12345');
      if (getjson) {
        var historyListObj = JSON.parse(getjson);
        console.log(historyListObj);
        return historyListObj;
      } else {
        return false;
      }
    }

})




// 画面表示と保存ボタンのイベントを設定
// document.addEventListener('DOMContentLoaded', restore_options);
