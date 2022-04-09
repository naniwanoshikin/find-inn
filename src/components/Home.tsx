import React, { Key } from "react";
import "./Common.css";

// カレンダー導入
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// 日本語
import ja from "date-fns/locale/ja";

// axios
import axios from "axios";
// 日付算定
import addDays from "date-fns/addDays";

import Result from "./Result";
import Loading from "./Loading";

// 型を作成 Result.tsx でも使えるようにする
export type Plan = {
  plan_id: Key;
  image_url: string;
  course_name: string;
  duration: string;
  price: string;
  evaluation: string;
  prefecture: string;
  plan_name: string;
  caption: string;
  reserve_url_pc: string;
};

const Home = () => {
  const Today = new Date();
  // プレー日
  const [date, setDate] = React.useState<Date>(Today);
  // 予算 ¥8000
  const [budget, setBudget] = React.useState<number>(8000);
  // 出発 東京駅
  const [departure, setDeparture] = React.useState<number>(1);
  // 移動時間 60分
  const [duration, setDuration] = React.useState<number>(60);
  // 検索結果 初期: Plan型の空の配列
  const [plans, setPlans] = React.useState<Plan[]>([]);
  // 検索件数 0件だった場合を考慮
  const [plansCount, setPlansCount] = React.useState<number | undefined>(
    undefined
  );
  // エラーの有無
  const [hasError, setHasError] = React.useState<boolean>(false);
  // ローディングの有無
  const [loading, setLoading] = React.useState<boolean>(false);
  // 変数や関数
  registerLocale("ja", ja);

  // ゴルフ場の取得の処理が終わるまでは次の処理はしない
  const onFormSubmit = async (event: { preventDefault: () => void }) => {
    try {
      event.preventDefault();
      // throw "error"; // エラー出す
      // ローディング開始
      setLoading(true);

      // 非同期通信 + axiosによるHTTP通信
      const response = await axios.get(
        // API の URL
        // エンドポイント: count, plans > price, duration
        "https://i8na69yys7.execute-api.ap-northeast-1.amazonaws.com/production/golf-courses",
        {
          params: {
            budget: budget,
            date: addDays(date, 14),
            departure: departure,
            duration: duration, // 所要時間 GoogleMaps API
          },
        }
      );
      // 正常にAPIのレスポンスが返ってきたら
      console.log(date, budget, departure, duration);
      console.log(response);

      // 検索結果
      setPlans(response.data.plans);
      // 検索件数
      // setPlansCount(0); // 0件
      setPlansCount(response.data.planCount); // 3件

      // ローディング終了
      setLoading(false);
    } catch (e) {
      console.log(e);
      setHasError(true);
    }
  };

  return (
    <div className="ui container" id="container">
      <div className="Search__Form">
        <form className="ui form segment" onSubmit={onFormSubmit}>
          <div className="field">
            <label>
              <i className="calendar alternate outline icon"></i>プレー日
            </label>
            <DatePicker
              // 日付を表示
              selected={date}
              // フォーマット
              dateFormat="yyyy/MM/dd"
              // Mon -> 月
              locale="ja"
              // 今日以降の日付のみ表示
              minDate={Today}
              // nullなら今日の日付
              onChange={(selectedDate) => {
                setDate(selectedDate || Today);
              }}
            />
          </div>
          <div className="field">
            <label>
              <i className="yen sign icon"></i>上限金額
            </label>
            <select
              className="ui dropdown"
              name="dropdown"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              <option value="8000">8,000円</option>
              <option value="12000">12,000円</option>
              <option value="16000">16,000円</option>
            </select>
          </div>
          <div className="field">
            <label>
              <i className="map pin icon"></i>
              移動時間計算の出発地点（自宅から近い地点をお選びください）
            </label>
            <select
              className="ui dropdown"
              name="dropdown"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
            >
              <option value="1">東京駅</option>
              <option value="2">横浜駅</option>
            </select>
          </div>
          <div className="field">
            <label>
              <i className="car icon"></i>車での移動時間の上限
            </label>
            <select
              className="ui dropdown"
              name="dropdown"
              value={departure}
              onChange={(e) => setDeparture(Number(e.target.value))}
            >
              <option value="60">60分</option>
              <option value="90">90分</option>
              <option value="120">120分</option>
            </select>
          </div>
          <div className="Search__Button">
            <button type="submit" className="Search__Button__Design">
              <i className="search icon"></i>ゴルフ場を検索する
            </button>
          </div>
        </form>
        {/* ローディングアイコン */}
        <Loading loading={loading} />
        {/* 検索結果: 一覧, 件数, エラーの有無 */}
        <Result plans={plans} plansCount={plansCount} error={hasError} />
      </div>
    </div>
  );
};

export default Home;
