// 외부모듈 포함
const express = require('express');
const app = express();
var bodyParser = require('body-parser');

// 서버+하이퍼레저 패브릭 연결 설정 
const { FileSystemWallet, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const ccpPath = path.resolve(__dirname ,'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

const PORT = 8080;
const HOST = '0.0.0.0';

app.use(express.static(path.join(__dirname, 'views')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// index, create, query html  라우팅
app.get('/', (req, res)=>{
    res.sendFile(__dirname+'/views/index.html')
})
app.get('/create', (req, res)=>{
    res.sendFile(__dirname+'/views/create.html')
})
app.get('/query', (req, res)=>{
    res.sendFile(__dirname+'/views/query.html')
})
// REST 라우팅
// /asset POST key, value -> 체인코드 연동 (GW연결-user1+ccp, mychannel, simpleasset, submitTransaction("set",key,value) => json ( 성공, 실패 )
app.post('/asset', async (req, res)=>{
    // 클라이언트로 온 요청문서에서 변수꺼내기
    const key = req.body.key;
    const value = req.body.value;

    // (TO DO) 오류체크 key, value 가 올바른지

    // 지갑에서 user1 인증서 가져오기
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = new FileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);
    const userExists = await wallet.exists('user1');
    if (!userExists) {
        console.log('An identity for the user "user1" does not exist in the wallet');
        console.log('Run the registerUser.js application before retrying');
        return;
    }
    // 게이트웨이에 연결하기
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });
    // 채널에 연결하기
    const network = await gateway.getNetwork('mychannel');
    // 체인코드 컴포넌트 가져오기
    const contract = network.getContract('simpleasset')
    // 체인코드 수행하기.
    const result = await contract.submitTransaction('set', key, value)

    // (TO DO) result 결과 분석 및 클라이언트에게 보낼 JSON 생성

    res.status(200).json(`Transaction has been submitted: ${result}`)
})
// /asset GET  key -> 체인코드 연동 (GW연결-user1+ccp, mychannel, simpleasset, evaluateTransaction("get",key)  => json ( 성공, 실패, value )
app.get('/asset', async (req, res)=>{
    // 클라이언트로 온 요청문서에서 변수꺼내기
    const key = req.query.key;

    // (TO DO) 오류체크 key 가 올바른지

    // 지갑에서 user1 인증서 가져오기
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = new FileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);
    const userExists = await wallet.exists('user1');
    if (!userExists) {
        console.log('An identity for the user "user1" does not exist in the wallet');
        console.log('Run the registerUser.js application before retrying');
        return;
    }
    // 게이트웨이에 연결하기
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });
    // 채널에 연결하기
    const network = await gateway.getNetwork('mychannel');
    // 체인코드 컴포넌트 가져오기
    const contract = network.getContract('simpleasset')
    // 체인코드 수행하기.
    const result = await contract.evaluateTransaction('get', key)

    // (TO DO) result 결과 분석 및 클라이언트에게 보낼 JSON 생성

    res.status(200).json(result.toString());
})
// 서버 시작
app.listen(PORT,HOST);
console.log(`Running on http://${HOST}:${PORT}`)