const API_HOST = "https://mqtt.kiaofarming.com";
const PROXY_HOST = 'https://cors-anywhere.herokuapp.com/';
const API_VER = "v1";
/*
var deviceList = [{
  name: '調光LED燈',
  tags: ['風扇', '灑水'],
  ssid: 'wf8011',
  devID: 'wjWXd'
},{
  name: 'Sean專用機',
  tags: ['關關', '通知燈'],
  ssid: 'wf8010',
  devID: 'QrkNV'
}];
*/

let url = '?openExternalBrowser=1';
window.history.pushState(null, null, url);

var deviceList = new Array();

function reloadWindow(){
      const devList = document.getElementById('devList');
      const devMenu = document.getElementById('devMag');

      devList.replaceChildren();
      devMenu.replaceChildren();

      listenDevice();
      showDeviceMenu();
}

function download(filename, data) {
    const blob = new Blob([data], {type: 'text/csv'});
    if(window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    }
    else{
        const elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
    }
}

function set_switch(dev_id, port, sw, cb) {
  let req_data = {};
  req_data[`port${port}`] = sw;

  $.ajax({
    url: `${API_HOST}/${API_VER}/controller/switch/${dev_id}`,
    method: "POST",
    contentType: "application/x-www-form-urlencoded",
    headers: {
      "Authorization": "Bearer {nTqOrlSptF156qc26duTSQhmuWFVA2RCeLCRRaenTb2}",
    },
    dataType: "json",
    data: req_data
  }).done(resp_data => {
    cb(resp_data);
  });
}

function get_device_id_validity(dev_id, ssid, cb) {
  let req_data = {};
  req_data["device_id"] = dev_id;
  req_data["ssid"] = ssid;

  $.ajax({
    url: `${API_HOST}/${API_VER}/utility/deviceIdValidity`,
    method: "GET",
    data: req_data,
    dataType: "json",
  }).done(resp_data => {
    cb(resp_data);
  });
}

function process_switch_response(resp) {
  switch (resp.status) {
    case 200:
      console.log("設定開關成功");
      break;

    case 400:
      console.log("Bad Request");
      break;

    case 408:
      console.log("裝置回應逾時");
      break;

    case 500:
      console.log("API伺服器內部發生錯誤");
      break;

    default:
  }
}

function viewDevice(key, devices, ports) {
  let portNum = ports;

  const blockId = document.getElementById(`block${key}`);
  if (blockId != null) {
    return;
  }

  const device = devices[key];

  const devList = document.getElementById('devList');
  const devName = document.createElement('h3');
  const devText = document.createElement('h4');
  const block = document.createElement('div');
  const br = document.createElement('br');
  const hr = document.createElement('hr');
  const blockButton = [];
  const blockState = [];

  block.setAttribute('id', `block${key}`);

  devName.setAttribute('id', 'deviceName');
  devName.innerHTML = device.name;
  devText.setAttribute('style', 'text-align: left;margin-left: 60px;');
  devText.innerHTML = '開關狀態';

  block.setAttribute('class', 'flex-container');

  for (let i = 0; i < portNum; i++) {
    blockState.push(document.createElement('span'));
    blockState[i].setAttribute('id', 'state');
    blockState[i].setAttribute('style', 'text-align: center;');
    blockState[i].textContent = "OFF";
  }

  for (let i = 0; i < portNum; i++) {
    blockButton.push(document.createElement('div'));
    blockButton[i].setAttribute('name', 'dev_switch');
    blockButton[i].setAttribute('id', 'btn');
    blockButton[i].setAttribute('class', 'block-btn');
    blockButton[i].setAttribute('style', 'width:25%');
    blockHead = document.createElement('h4');
    blockHead.textContent = device.tags[i].name;

    blockButton[i].appendChild(blockHead);

    blockButton[i].appendChild(blockState[i]);
/*
    if(device.enable[i] == true) {
	blockButton[i].style.visibility='visible';
    } else {
	blockButton[i].style.visibility='hidden';
    }
*/
    block.appendChild(blockButton[i]);
  }

//  devList.appendChild(br);
//  devList.appendChild(hr);
//  devList.appendChild(devName);
//  devList.appendChild(devText);
//  devList.appendChild(br);
  devList.appendChild(block);
//  devList.appendChild(hr);

  blockButton.forEach((e, index) => {
    let self = e;
    let i = index;

    self.addEventListener('click', (ev) => {
      let st = blockState[i].textContent;
      let sw = 'off';

      if (st == 'OFF') {
        sw = 'on';
      } else {
        sw = 'off';
      }

      set_switch(deviceList[key].devID, (i + 1), sw, process_switch_response);
    });
  });
}

async function state_refresh(dev, key) {

  await viewDevice(key, deviceList, 2);

  const device = deviceList[key];

  const blockState = document.querySelectorAll(`#block${key} span`);
  const blockButton = document.querySelectorAll(`#block${key} div`);
  const devName = document.querySelectorAll(`#devList h3`);
  const devBlock = document.getElementById(`block${key}`);

  console.log(dev);

  if (dev.online != undefined) {
    if (dev.online == true) {

      for (let i = 0; i < dev.switch.length; i++) {
       	blockState[i].style.color = '#202020';
       	blockButton[i].style.color = '#202020';
      }
      devBlock.disabled = true;

//      devName[key].style.backgroundColor = "#1C8686";

    } else {

      for (let i = 0; i < dev.switch.length; i++) {
        blockState[i].style.color = '#909090';
        blockButton[i].style.color = '#909090';
      }
      devBlock.disabled = false;

//      devName[key].style.backgroundColor = "#a0a0a0";

    }
  }

  if (dev.switch != undefined) {
    for (let i = 0; i < dev.switch.length; i++) {
      let st = 'OFF';
      let color = '#E0E0E0';
      if (dev.switch[i] == true) {
        st = 'ON';
        color = '#8FCDE4';
      }
      
      blockState[i].textContent = st;
      blockButton[i].style.backgroundColor = color;
    }
  }
}

function btnSubmit() {
  var newDevice = {
    name: document.getElementById('name').value,
    tags: [{
	  enable: document.getElementById('enable1').checked,
	  name: document.getElementById('tags1').value
	},{
	  enable: document.getElementById('enable2').checked,
	  name: document.getElementById('tags2').value
	}],
    ssid: document.getElementById('valid_ssid').value,
    devID: document.getElementById('valid_dev_id').value
  };

  console.log(document.getElementById('enable1'),newDevice);

  if (newDevice.name === "" || newDevice.ssid === "" || newDevice.devID === "") {
    return;
  }

  deviceList.push(newDevice);

  var strJSON = JSON.stringify(deviceList);
  localStorage.setItem('myList', strJSON);
}

function showDeviceMenu() {
  const devMenu = document.getElementById('devMag');
  
  var devItem = null;

  for (let i = 0; i < deviceList.length; i++) {
    // 創建元素
    const buttonContainer = document.createElement('div');
    const devItem = document.createElement('li');
    const deleteItem = document.createElement('div');

    // 設置元素的屬性和內容
    buttonContainer.setAttribute('class', 'button-container');
    devItem.setAttribute('class', 'useDevice');
    devItem.innerHTML = deviceList[i].name;
    deleteItem.setAttribute('class', 'delete');
    deleteItem.setAttribute('id', `${i}`);
    deleteItem.textContent = '—';

    // 將元素添加到容器中
    buttonContainer.appendChild(devItem);
    buttonContainer.appendChild(deleteItem);

    // 將容器添加到文檔中的某個元素中
    const parentElement = document.querySelector('#devMag'); // 替換為實際的父元素選擇器
    parentElement.appendChild(buttonContainer);

    deleteItem.addEventListener('click', () => {
      console.log(deleteItem.id);
      deviceList.splice(deleteItem.id,1);
      
      var strJSON = JSON.stringify(deviceList);
      localStorage.setItem('myList', strJSON);
      reloadWindow();
//      buttonContainer.remove(); // 移除包含 deleteItem 和 devItem 的 buttonContainer
    });
  }
}

window.onload = () => {
  var strJSON = localStorage.getItem('myList');

  if (strJSON != null && strJSON != "") {
    console.log(strJSON);
    deviceList = JSON.parse(strJSON);
    showDeviceMenu();
  }

  //*跳出視窗*//
  let btn = document.querySelector("#show");
  let infoModal = document.querySelector("#infoModal");
  var infoItems = document.querySelectorAll("#infoModal input");
  let downloadBtn = document.getElementById('download');
  let uploadBtn = document.getElementById('upload');

  uploadBtn.addEventListener("change",function (){
//  uploadBtn.addEventListener("click",function (){
    var files = this.files;
    if (files.length === 0) {
        console.log('No file is selected');
        return;
    }

    var reader = new FileReader();
    reader.onload = function(event) {
	strJSON = event.target.result;
	localStorage.setItem('myList', strJSON);
	deviceList = JSON.parse(strJSON);
	reloadWindow();
    };
    reader.readAsText(files[0]);
  });

  downloadBtn.addEventListener("click",function (){
    download("deviceList.json",JSON.stringify(deviceList)); 
  });

  btn.addEventListener("click", function () {
    for (let i = 0; i < infoItems.length; i++) {
      if(infoItems[i].name != 'enable') {
        infoItems[i].setAttribute("required", "required");
      }
    }
    infoModal.showModal();
  });

  let close = document.querySelector("#close");
  close.addEventListener("click", function () {
    for (let i = 0; i < infoItems.length; i++) {
      infoItems[i].removeAttribute("required");
    }
    infoModal.close();
  });

  if (deviceList.length <= 0)
    return;

  listenDevice();
}

let evt_src = null;

function listenDevice() {
  //  const urlAPI = `${API_HOST}/${API_VER}/notify?device=${deviceList[0].ssid},${deviceList[0].devID};${deviceList[1].ssid},${deviceList[1].devID}`;
  let urlAPI = `${API_HOST}/${API_VER}/notify?device=`;

  if(deviceList.length <= 0)
	return;

  deviceList.forEach((e, index) => {
    let dev = e;
    urlAPI = urlAPI.concat(`${dev.ssid},${dev.devID};`);
  });

  console.log(urlAPI);

  evt_src = new EventSource(urlAPI);

  // Server-Send Event example
  evt_src.addEventListener("init", (ev) => { // return all device data array
    devs = JSON.parse(ev.data);
    for (let j = 0; j < deviceList.length; j++) {
      for (let i = 0; i < devs.length; i++) {
        let dev = devs[i];
        if (dev.ssid == deviceList[j]['ssid'] && dev.device == deviceList[j]['devID']) {
          state_refresh(dev, j);
          break;
        }
      }
    }
  });

  evt_src.addEventListener("updated", (ev) => { // Device send updated data
    dev = JSON.parse(ev.data);
    for (let j = 0; j < deviceList.length; j++) {
      if (dev.ssid == deviceList[j]['ssid'] && dev.device == deviceList[j]['devID']) {
        state_refresh(dev, j);
      }
    }
  });

  evt_src.addEventListener("online", (ev) => { //Device online status changed 
    dev = JSON.parse(ev.data);
    for (let j = 0; j < deviceList.length; j++) {
      if (dev.ssid == deviceList[j]['ssid'] && dev.device == deviceList[j]['devID']) {
        state_refresh(dev, j);
      }
    }
  });
}
