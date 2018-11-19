const moment = require('moment');
const WebSocket = require('ws');
const pako = require('pako');
const CryptoJS = require ('crypto-js')

const WS_URL = 'wss://api.huobi.pro/ws/v1';

const host = "api.huobi.pro";
const uri = "/ws/v1"


// 修改您的accessKey 和 secretKey
const config = {
    accessKey: "XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXX",
    secretKey: "XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXX"
}


/**
 * 签名计算
 * @param method
 * @param host
 * @param path
 * @param data
 * @returns {*|string}
 */
function sign_sha(method, host, path, data) {
    var pars = [];

    //将参数值 encode
    for (let item in data) {
        pars.push(item + "=" + encodeURIComponent(data[item]));
    }

    //排序 并加入&连接
    var p = pars.sort().join("&");

    // 在method, host, path 后加入\n
    var meta = [method, host, path, p].join('\n');

    //用HmacSHA256 进行加密
    var hash = CryptoJS.HmacSHA256(meta, config.secretKey);
    // 按Base64 编码 字符串
    var Signature = CryptoJS.enc.Base64.stringify(hash);
    // console.log(p);
    return Signature;
}

/**
 * 发送unsub
 * @param ws
 */
function unsub(ws) {
    var data ={
        op:"unsub",
        cid:"111",
        topic:"accounts"

    }

    ws.send(JSON.stringify(data));

}

/**
 * 发送sub
 * @param ws
 */
function sub(ws) {

    var data ={
        op:"sub",
        cid:"111",
        topic:"accounts"

    }

    ws.send(JSON.stringify(data));

}

/**
 * 发送req
 * @param ws
 */
function req(ws) {

    var data ={
        op:"req",
        cid:"111",
        topic:"orders.list"
    }

    ws.send(JSON.stringify(data));
}

/**
 * 发送auth请求
 * @param ws
 */
function auth(ws) {

    const timestamp = moment.utc().format('YYYY-MM-DDTHH:mm:ss');

    var data = {
        AccessKeyId: config.accessKey,
        SignatureMethod: "HmacSHA256",
        SignatureVersion: "2",
        Timestamp: timestamp,
    }

    //计算签名
    sign_sha('GET', host, uri, data);
    data["op"]="auth";
    console.log(data);
    ws.send(JSON.stringify(data));
}


function init() {
    var ws = new WebSocket(WS_URL);
    ws.on('open', () => {
        console.log('open');
        auth(ws);
    });
    ws.on('message', (data) => {
        let text = pako.inflate(data, {
            to: 'string'
        });

        let msg = JSON.parse(text);

        if (  msg["err-code"] && msg["err-code"] !=0 ) {
            //TODO 发生错误，可进行自定义处理
            console.error(msg);
        }

        if (msg.op=="auth"){
            console.log(msg)
            sub(ws);//TODO  发送sub请求
        }else if (msg.op == "ping") {

            var pong ={
                op: "pong",
                ts: msg.ts
            };
            console.log(msg);
            console.log(pong);
            // 维持 ping pong
            ws.send(JSON.stringify(pong));
        }else if (msg.op=""){
            // TODO 接收信息 进行业务处理
            console.log(msg)
        }


    });
    ws.on('close', () => {
        // websocket连接关闭处理
        console.log('close');
        init();
    });

    ws.on('error', err => {
        // websocket连接关闭处理
        console.log('error', err);
        init();
    });
}

init();