import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";
import '@polkadot/api-augment'
import  type { FrameSystemAccountInfo } from "@polkadot/types/lookup";
import {KeyringPair} from '@polkadot/keyring/types';

const WEB_SOCKET = "ws://127.0.0.1:9944";
const connect = async () => {
    const wsProvider = new WsProvider(WEB_SOCKET);
    const api = await ApiPromise.create({provider: wsProvider,types:{}});
    await api.isReady;
    return api;
}

const getFreeBalance = async (api: ApiPromise,address: string) => {
    const {data: {free,},}: FrameSystemAccountInfo = await api.query.system.account(address);
    return free;
}

const transfer = async (api: ApiPromise,alice: KeyringPair,bob:string,amount:number) => {
    await api.tx.balances.transfer(bob,amount).signAndSend(alice,(res:any) => {
        console.log(`Tx status: ${res.status}`);
    })
}

const getMetadata =async (api:ApiPromise) => {
    const metadata = await api.rpc.state.getMetadata();
    return metadata.toString();
}

const subscribe = async (api: ApiPromise,address: string) => {
    await api.query.system.account(address,aliceInfo => {
        const free = aliceInfo.data.free;
        console.log('free balance is: ',free.toHuman());
    })
}

const eventSubscribe = async (api: ApiPromise) => {
    await api.query.system.events(events => {
        events.forEach( function (event) {
            console.log('index',event['event']['index'].toHuman());
            console.log('data',event['event']['data'].toHuman());
        })
    })
}

const main = async () => {
    const api = await connect();
    const keyring = new Keyring({type: 'sr25519'});
    const alice = keyring.addFromUri('//Alice');
    const bob = keyring.addFromUri('//Bob');

    await subscribe(api,alice.address);

    await eventSubscribe(api);

    const aliceBalance =await getFreeBalance(api,alice.address);
    console.log("alice is ",aliceBalance.toHuman());

    await transfer(api,alice,bob.address,10 ** 10 + 1);

    const bobBalance =await getFreeBalance(api,bob.address);
    console.log("bob is ",bobBalance.toHuman());

    let metadata =  await getMetadata(api);

    // console.log("getMetadata is ",metadata);

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