import React from "react";
// ReactDOM: .jsxや.tsx形式で書かれたコードを実際の DOM 要素に変換してくれるライブラリ
import ReactDOM from "react-dom";
import Home from "./components/Home";

ReactDOM.render(
  // 開発環境で何か問題が発生した際に、警告を出してくれる
  <React.StrictMode>
    <Home />
  </React.StrictMode>,
  document.getElementById("root")
);
