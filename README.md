# このサンプルを動かすには

## サーバー環境

- Tapyrus Coreノードの起動
- Tapyrus Signerノードの起動(任意)
  - 開発環境であれば、集約秘密鍵を用いて直接ブロックを作成することができるのでSignerは必須ではない。
- Electrs Tapyrusの起動
- Elect httpの起動
    ```
    git clone https://github.com/Yamaguchi/elect_http
    cd elect_http
    bundle install
    ./bin/rails s
    ```
- Tapyrus Tokenの発行
- Walletへの送付

## モバイルアプリ

### Cordovaのインストール

https://cordova.apache.org/#getstarted を参照。

```npm install -g cordova```

### アプリのビルド

```
npm run build
```


### シミュレーターで起動(iOS/Android)

```
cordova run ios
cordova run android 
```


# そのた

- iPhoneシミュレーター起動後はSafariでデバッグ可能
- iOSの動作確認はXCodeのインストールが必要。
- Androidの動作確認はAndroid SDK(Android Studio)のインストールが必要。
