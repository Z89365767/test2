import { ApiPromise, HttpProvider, Keyring, WsProvider } from "@polkadot/api";
import '@polkadot/api-augment'
import {KeyringPair} from '@polkadot/keyring/types';

const WEB_SOCKET = "ws://127.0.0.1:9944";
const connect = async () => {
    const wsProvider = new WsProvider(WEB_SOCKET);
    const api = await ApiPromise.create({provider: wsProvider,types:{}});
    await api.isReady;
    return api;
}



const main = async () => {
    const api = await connect();

  // 订阅template pallet中的值的更新
  api.query.templateModule.something((result:any) => {
    console.log('Value updated:', result.toHuman());
  });

   // 订阅template pallet中的事件
   api.query.system.events((events) => {
    events.forEach((record) => {
      const { event } = record;
      if (event.section === 'templateModule' && event.method === 'SomethingStored') {
        console.log('Event received:', event.data.toString());
      }
    });
  });

  // 配置账户信息
  const keyring = new Keyring({ type: 'sr25519' });
  const alice = keyring.addFromUri('//Alice');

  // 构造交易并发送
  const tx = api.tx.templateModule.doSomething(7);
  await tx.signAndSend(alice);

  await sleep(100000);

    console.log("main function");
}

main().then(() => {
    console.log("exits with success");
    process.exit(0);
}).catch(err => {
    console.log("error is ",err);
    process.exit(1);
})

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}