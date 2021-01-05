/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
var global = global || window;
global.Buffer = global.Buffer || require("buffer").Buffer;

global.tapyrus = require("tapyrusjs-lib");
global.wallet = require("tapyrusjs-wallet");

document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {
  // alert('Running cordova-' + cordova.platformId + '@' + cordova.version);
  try {
    const keyStore = new wallet.KeyStore.CordovaKeyStore();
    const dataStore = new wallet.DataStore.CordovaDataStore();
    const config = new wallet.Config({
      schema: "http",
      host: "localhost",
      port: "3000",
      path: "",
      network: "prod",
    });

    const alice = new wallet.Wallet.BaseWallet(keyStore, dataStore, config);

    global.alice = alice;
  } catch (e) {
    alert(e.message);
  }
}

document
  .getElementById("import")
  .addEventListener("click", onImportClick, false);

function onImportClick(e) {
  const xPriv =
    document.getElementById("extendedPrivateKey").value ||
    "xprv9s21ZrQH143K2xjLUb6KPjDjExyBLXq6K9u1gGQVMLyvewCLXdivoY7w3iRxAk1eX7k51Dxy71QdfRSQMmiMUGUi5iKfsKh2wfZVEGcqXEe";
  global.alice
    .importExtendedPrivateKey(xPriv)
    .then(() => alert("import successfully"))
    .catch((e) => {
      alert("import failed:" + e["code"]);
    });
}

document
  .getElementById("importwif")
  .addEventListener("click", onImportWifClick, false);

function onImportWifClick(e) {
  const wif =
    document.getElementById("wif").value ||
    "KwUvWuyqs5GcBmQBMNEZz72nWMid6CzaRE2E75YdoR19eP8iCgFS";
  global.alice
    .importWif(wif)
    .then(() => alert("import successfully"))
    .catch((e) => {
      alert("import failed:" + e);
    });
}

document
  .getElementById("update")
  .addEventListener("click", onUpdateClick, false);

function onUpdateClick(e) {
  try {
    global.alice.update().then(() => alert("update"));
  } catch (e) {
    alert(e.message);
  }
}

document
  .getElementById("uncoloredbalance")
  .addEventListener("click", onUncoloredBalanceClick, false);

function onUncoloredBalanceClick(e) {
  try {
    global.alice
      .balance()
      .then((balance) => alert("balance:" + JSON.stringify(balance)))
      .catch((reason) => console.log(reason));
  } catch (e) {
    alert(e.message);
  }
}

document
  .getElementById("coloredbalance")
  .addEventListener("click", onColoredBalanceClick, false);

function onColoredBalanceClick(e) {
  const colorId = document.getElementById("balanceColorId").value;
  try {
    global.alice
      .balance(colorId)
      .then((balance) => alert("balance:" + JSON.stringify(balance)))
      .catch((reason) => console.log(reason));
  } catch (e) {
    alert(e.message);
  }
}

document.getElementById("send").addEventListener("click", onSendClick, false);

function collect(utxos, amount) {
  let sum = 0;
  const collected = [];
  for (const utxo of utxos) {
    sum += utxo.value;
    collected.push(utxo);
    if (sum >= amount) {
      break;
    }
  }
  if (sum >= amount) {
    return { sum, collected };
  } else {
    throw new Error("Insufficient Token");
  }
}

async function onSendClick(e) {
  const address = document.getElementById("sendAddress").value;
  const amount = Number(document.getElementById("sendAmount").value);
  const keys = await global.alice.keyStore.keys();
  const txb = new tapyrus.TransactionBuilder(tapyrus.networks.prod);
  const pair = tapyrus.ECPair.fromPrivateKey(Buffer.from(keys[0], "hex"));
  const script = tapyrus.payments.p2pkh({ address });
  const changePubkeyScript = tapyrus.payments.p2pkh({
    pubkey: pair.publicKey,
  });
  const utxos = await global.alice.utxos();
  console.log(utxos);
  txb.setVersion(1);
  const { sum, collected } = collect(utxos, amount);
  console.log(collected, sum);
  for (var utxo of collected) {
    txb.addInput(
      utxo.txid,
      utxo.index,
      undefined,
      Buffer.from(utxo.scriptPubkey, "hex")
    );
  }
  const fee = 10000;
  txb.addOutput(script.output, amount);
  txb.addOutput(changePubkeyScript.output, sum - amount - fee);

  const signedTxb = await wallet.Signer.sign(global.alice, txb, collected, {
    network: tapyrus.networks.prod,
  });
  const tx = signedTxb.build();
  console.log(tx.toHex());
  alice.broadcast(tx).catch((error) => {
      console.log("broadcast error");
      console.log(error);
  });
}

document
  .getElementById("transfer")
  .addEventListener("click", onTransferClick, false);

async function onTransferClick(e) {
  const colorId = document.getElementById("transferColorId").value;
  const address = document.getElementById("transferAddress").value;
  const amount = Number(document.getElementById("transferAmount").value);
  const keys = await global.alice.keyStore.keys();
  const pair = tapyrus.ECPair.fromPrivateKey(Buffer.from(keys[0], "hex"));
  const changePubkeyScript = tapyrus.payments.p2pkh({
    pubkey: pair.publicKey,
  }).output;
  try {
    const result = await global.alice.transfer(
      [
        {
          colorId: colorId,
          amount: amount,
          toAddress: address,
        },
      ],
      changePubkeyScript
    );
    const signedTxb = await wallet.Signer.sign(
      global.alice,
      result.txb,
      result.inputs
    );
    const tx = signedTxb.build();
    console.log(tx.toHex());
    alice.broadcast(tx).catch((error) => {
      console.log("broadcast error");
      console.log(error);
    });
  } catch (e) {
    alert(e.message);
  }
}

