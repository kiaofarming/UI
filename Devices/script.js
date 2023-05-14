const API_HOST = "https://mqtt.kiaofarming.com";
const PROXY_HOST = 'https://cors-anywhere.herokuapp.com/';
const API_VER = "v1";



const objectName = {
  deviceName: '調光LED燈',
  switchName: ['風扇', '灑水'],
  ssid: 'wf8011',
  devID: 'wjWXd'
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
window.onload = () => {


  let portNum = 2;

  const zone = document.getElementById('zone');
  const zoneButton = [];
  const zoneState = [];

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
    zoneHead.textContent = '開關' + String(i + 1);

    zoneButton[i].appendChild(zoneHead);

    zoneButton[i].appendChild(zoneState[i]);
    zone.appendChild(zoneButton[i]);
  }

  //*跳出視窗*//
  let btn = document.querySelector("#show");
  let infoModal = document.querySelector("#infoModal");
  btn.addEventListener("click", function () {
    infoModal.showModal();
  });

  let close = document.querySelector("#close");
  close.addEventListener("click", function () {
    infoModal.close();
  });
  console.log()
  //**視窗 */



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

      set_switch('wjWXd', (i + 1), sw, process_switch_response);
    });
  });

  // Server-Send Event example


  let evt_src = new EventSource(`${API_HOST}/${API_VER}/notify?device=wf8011,wjWXd`);

  evt_src.addEventListener("init", (ev) => { // Return all device data array
    devs = JSON.parse(ev.data);
    devs.forEach((e, index) => {
      let dev = e;
      if (dev.ssid == objectName['ssid'] && dev.device == objectName['devID']) {
        state_refresh(dev);
      }
    });
  });

  evt_src.addEventListener("updated", (ev) => { // Device send updated data
    dev = JSON.parse(ev.data);

    if (dev.ssid == objectName['ssid'] && dev.device == objectName['devID']) {
      state_refresh(dev);
    }
  });

  evt_src.addEventListener("online", (ev) => { //Device online status changed 
    dev = JSON.parse(ev.data);
    if (dev.ssid == objectName['ssid'] && dev.device == objectName['devID']) {
      state_refresh(dev);
    }
  });

  function state_refresh(dev) {


    if (dev.online != undefined) {
      if (dev.online == true) {
        objectName['deviceName'].style.backgroundColor = "#1C8686";
      } else {
        objectName['deviceName'].style.backgroundColor = "#a0a0a0";
      }
    }

    if (dev.switch != undefined) {
      for (i = 0; i < dev.switch.length; i++) {
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
  }
  const div = document.createElement('div');

  div.textContent = objectName.deviceName;

  const deviceFlex = document.querySelector('#deviceName');
  deviceFlex.appendChild(div);
}
