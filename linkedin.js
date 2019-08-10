(function() {
  
  firstDeg = [['First Degree','Second Degree']];
  secDeg = [['Second Degree Name', 'Title', 'Company', 'Shared Connectoion', 'LinkedIn Profile']];
  
  function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  function loadToCSV(fileName, arrayName){
    var processRow = function (row) {
        var finalVal = '';
        for (var j = 0; j < row.length; j++) {
            var innerValue = row[j] === null ? '' : row[j].toString();
            if (row[j] instanceof Date) {
                innerValue = row[j].toLocaleString();
            };
            var result = innerValue.replace(/"/g, '""');
            if (result.search(/("|,|\n)/g) >= 0)
                result = '"' + result + '"';
            if (j > 0)
                finalVal += ',';
            finalVal += result;
        }
        return finalVal + '\n';
    };
  
    var csvFile = '';
    for (var i = 0; i < arrayName.length; i++) {
        csvFile += processRow(arrayName[i]);
    }
  
    var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, fileName);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            console.log(fileName);
            link.click();
            document.body.removeChild(link);
        }
    }
  }
  
  function cleanName(str){
    str = str.split(',',1)[0];
    str = str.split('-',1)[0];
    str = str.replace(/mba/gi, '');
    str = str.replace(/pmp/gi, '');
    str = str.replace(/phd/gi, '');
    str = str.replace(/cissp/gi, '');
    str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^0-9a-z]/gi, ' ');
    str = str.trim().replace(/\s\s+/g, ' ');
    return str;
  }
  
  function getSDeg(sr){
    Name = cleanName(sr.getElementsByClassName('result-lockup__name')[0].innerText);
    Title = sr.getElementsByClassName('result-lockup__highlight-keyword')[0].getElementsByTagName('span')[0].innerText;
    Company = sr.getElementsByClassName('result-lockup__highlight-keyword')[0].getElementsByTagName('span')[1].getElementsByTagName('a')[0].getElementsByTagName('span')[0].innerText.trim();
    Profile = sr.getElementsByClassName('result-lockup__name')[0].getElementsByTagName('a')[0].href;
    if (sr.getElementsByClassName('type-shared_connections').length!==0) {
      Conn = parseInt(sr.getElementsByClassName('type-shared_connections')[0].innerText.match(/\d+/)[0]);
    } else {
      Conn = 0;
    }
    console.log(Name);
    secDeg.push([Name,Title,Company,Conn,Profile]);
  }
  
  function getFDeg(shared,sr){
    Name = cleanName(sr.getElementsByClassName('result-lockup__name')[0].innerText);
    console.log(shared.length);
    for(let i=0;i<shared.length;i++){
     d = shared[i].innerText.trim();
     if(d){
       d = cleanName(d);
       firstDeg.push([d,Name]);
       console.log(d,Name);
     }
    }
  }
  
  async function showShared(sr){
    try{
      sr.getElementsByClassName('result-context__connection-button')[0].click();
      await sleep(500);
      console.log('buttonclicked')
      shared = sr.getElementsByClassName('result-context__connection-name');
      getFDeg(shared,sr);
      nextButton = sr.getElementsByClassName('next')[0];
      if (!nextButton.disabled) {
        nextButton.click();
        getFDeg(shared,sr);
      } else {}
    } catch(error){
      console.log(error);
    }
  }
  
  async function scroll(){
    await window.scrollTo(0,document.body.scrollHeight);
    console.log("first scroll");
    await sleep(1000);
    await window.scrollTo(0,document.body.scrollHeight);
    console.log("second scroll");
    await sleep(1000);
    await window.scrollTo(0,document.body.scrollHeight);
    console.log("third scroll");
    await sleep(1000);
  }
  
  async function goToNextPage(){
    await document.getElementsByClassName("search-results__pagination-next-button")[0].click();  
    console.log("click");
    await sleep(1000);
    console.log("waited");
  }
  
  function downloadCSV(){
    loadToCSV('firstDeg.csv',firstDeg);
    loadToCSV('secDeg.csv',secDeg);
  }
  
  async function singlePageScrape(){
    try {
      searchResults = document.getElementsByClassName('search-results__result-item');
      for(let i=0; i<searchResults.length; i++) {
        console.log('loop' + i)
        sr = searchResults[i];
        getSDeg(sr);
        haveShared = sr.getElementsByClassName('type-shared_connections').length;
        if (haveShared!==0) {
          await showShared(sr);    
        }
        else{
          continue;  
        }
      }
      await goToNextPage();
    }
    catch (error){
      console.log(error);
    };
  }
  
  async function scrape(){
    finished = false;
    while(!finished) {
      await scroll();  
      finished = document.getElementsByClassName("search-results__pagination-next-button")[0].disabled;
      await singlePageScrape();
    }    
  }
  
  scrape().then(() => downloadCSV());

})();