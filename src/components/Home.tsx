import React, { Key } from "react";
import "./Common.css";

// カレンダーを導入
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// 日本語設定
import ja from "date-fns/locale/ja";

// axios
import axios from "axios";
// 日付算定
import addDays from "date-fns/addDays";

import Result from "./Result";
import Loading from "./Loading";

// 型をつける Result.tsx
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
  // 予算
  const [budget, setBudget] = React.useState<number>(8000);
  // 出発地
  const [departure, setDeparture] = React.useState<number>(1);
  // 移動時間 上限
  const [duration, setDuration] = React.useState<number>(60);
  // 検索結果 Plan型の配列にする
  const [plans, setPlans] = React.useState<Plan[]>([]);
  // 検索結果 件数
  const [plansCount, setPlansCount] = React.useState<number | undefined>(
    undefined
  );
  // エラーが起きたかを管理
  const [hasError, setHasError] = React.useState<boolean>(false);
  // ローディング状態
  const [loading, setLoading] = React.useState<boolean>(false);
  // 変数や関数
  registerLocale("ja", ja);

  // 非同期: ゴルフ場の取得の処理が終わるまでは次の処理はしない
  const onFormSubmit = async (event: { preventDefault: () => void }) => {
    try {
      event.preventDefault();

      // throw "error";

      // 非同期で通信している間だけローディングする
      setLoading(true);

      // axiosを使って、HTTP通信を行う
      const response = await axios.get(
        "https://l1kwik11ne.execute-api.ap-northeast-1.amazonaws.com/production/golf-courses",
        {
          params: {
            date: addDays(date, 14),
            budget: budget,
            departure: departure,
            duration: duration,
          },
        }
      );
      // 正常にAPIのレスポンスが返ってきたら、plans Stateに更新
      setPlans(response.data.plans);
      // setPlansCount(0); // planCount が 0とする
      setPlansCount(response.data.planCount);
      console.log(date, budget, departure, duration);
      console.log(response);

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
              // 日付表示
              dateFormat="yyyy/MM/dd"
              locale="ja" // Mon -> 月
              selected={date}
              // 過去の日付を出さない
              minDate={Today}
              // nullなら、今日の日付を表示
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
        <Loading loading={loading} />
        <Result plans={plans} plansCount={plansCount} error={hasError} />
      </div>
    </div>
  );
};

export default Home;
