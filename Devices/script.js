const API_HOST = "https://mqtt.kiaofarming.com";
const PROXY_HOST = 'https://cors-anywhere.herokuapp.com/';
const API_VER = "v1";



var deviceList = [{
  name: '調光LED燈',
  tags: ['風扇', '灑水'],
  ssid: 'wf8011',
  devID: 'wjWXd'
}, {
  name: 'Sean專用機',
  tags: ['開關', '通知燈'],
  ssid: 'wf8010',
  devID: 'QrkNV'
}]


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

  const device = devices[key];

  const devList = document.getElementById('devList');
  const devName = document.createElement('h3');
  const devText = document.createElement('h4');
  const zone = document.createElement('div');
  const br = document.createElement('br');
  const hr = document.createElement('hr');
  const zoneButton = [];
  const zoneState = [];

  zone.setAttribute('id', `zone${key}`);

  devName.setAttribute('id', 'deviceName');
  devName.innerHTML = device.name;
  devText.setAttribute('style', 'text-align: left;margin-left: 60px;');
  devText.innerHTML = '開關狀態';

  zone.setAttribute('class', 'flex-container');

  for (let i = 0; i < portNum; i++) {
    zoneState.push(document.createElement('span'));
    zoneState[i].setAttribute('id', 'state');
    zoneState[i].setAttribute('style', 'text-align: center;');
    zoneState[i].textContent = "OFF";
  }

  for (let i = 0; i < portNum; i++) {
    zoneButton.push(document.createElement('div'));
    zoneButton[i].setAttribute('name', 'dev_switch');
    zoneButton[i].setAttribute('id', 'btn');
    zoneButton[i].setAttribute('class', 'zone-btn');
    zoneHead = document.createElement('h4');
    zoneHead.textContent = device.tags[i];

    zoneButton[i].appendChild(zoneHead);

    zoneButton[i].appendChild(zoneState[i]);
    zone.appendChild(zoneButton[i]);
  }

  devList.appendChild(br);
  devList.appendChild(devName);
  devList.appendChild(devText);
  devList.appendChild(zone);
  devList.appendChild(hr);

  zoneButton.forEach((e, index) => {
    let self = e;
    let i = index;

    self.addEventListener('click', (ev) => {
      let st = zoneState[i].textContent;
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

function state_refresh(dev) {
  for (let j = 0; j < deviceList.length; j++) {
    if (dev.ssid == deviceList[j]['ssid'] && dev.device == deviceList[j]['devID']) {
      const zoneState = document.querySelectorAll(`#zone${j} span`);
      const zoneButton = document.querySelectorAll(`#zone${j} div`);
      const devName = document.querySelectorAll(`#devList h3`);

      if (dev.online != undefined) {
        if (dev.online == true) {
          devName[j].style.backgroundColor = "#1C8686";
        } else {
          devName[j].style.backgroundColor = "#a0a0a0";
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
          zoneState[i].textContent = st;
          zoneButton[i].style.backgroundColor = color;
        }
      }
      return;
    }
  }
}

window.onload = () => {


  viewDevice(0, deviceList, 2);
  viewDevice(1, deviceList, 2);

  //*跳出視窗*//
  let btn = document.querySelector("#show");
  let infoModal = document.querySelector("#infoModal");
  btn.addEventListener("click", function () {
    console.log("Show button clicked"); 
    infoModal.showModal();
  });

  let close = document.querySelector("#close");
  close.addEventListener("click", function () {
    infoModal.close();
  });
  //**視窗 */

  //  const urlAPI = `${API_HOST}/${API_VER}/notify?device=${deviceList[0].ssid},${deviceList[0].devID};${deviceList[1].ssid},${deviceList[1].devID}`;
  let urlAPI = `${API_HOST}/${API_VER}/notify?device=`;

  deviceList.forEach((e, index) => {
    let dev = e;
    urlAPI = urlAPI.concat(`${dev.ssid},${dev.devID};`);
  });

  console.log(urlAPI);

  let evt_src = new EventSource(urlAPI);

  // Server-Send Event example
  evt_src.addEventListener("init", (ev) => { // return all device data array
    devs = JSON.parse(ev.data);
    devs.forEach((e, index) => {
      let dev = e;
      state_refresh(dev);
    });
  });

  evt_src.addEventListener("updated", (ev) => { // Device send updated data
    dev = JSON.parse(ev.data);
    state_refresh(dev);
  });

  evt_src.addEventListener("online", (ev) => { //Device online status changed 
    dev = JSON.parse(ev.data);
    state_refresh(dev);
  });
}

