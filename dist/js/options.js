$(function () {
  //ローカライズ化
  $("title, .exname").html(chrome.i18n.getMessage("extName"));
  $(".note").html(chrome.i18n.getMessage("optionNote"));

  $(".version").append(chrome.runtime.getManifest().version);

  if (!histryLoad()) {
    $(".history-clear").attr("disabled", true);
  }

  $(".history-clear").on("click", function () {
    localStorage.removeItem("qrcodeextensions12345");
    $(".history-list ul").html("");
    $(".history-clear").attr("disabled", true);
  });

  function histryLoad() {
    var getjson = localStorage.getItem("qrcodeextensions12345");
    if (getjson) {
      var historyListObj = JSON.parse(getjson);
      return historyListObj;
    } else {
      return false;
    }
  }
});
