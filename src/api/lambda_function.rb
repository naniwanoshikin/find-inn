require 'rakuten_web_service'
require 'aws-record'

class SearchInn
  include Aws::Record
  integer_attr :golf_course_id, hash_key: true
  integer_attr :duration1
  integer_attr :duration2
end

def lambda_handler(event:, context:)
  date = event['date'].to_s.insert(4, '-').insert(7, '-') # GORAで必要な形に直しています(例:20200520→2020-05-20)
  budget = event['budget'] # 予算
  departure = event['departure'] # 出発地点のコード
  duration = event['duration'] # 所要時間の上限

  # Rakuten API
  RakutenWebService.configure do |c|
    c.application_id = ENV['RAKUTEN_APPID']
    c.affiliate_id = ENV['RAKUTEN_AFID']
  end

  # 1. 「予約可能なゴルフ場」
  matched_plans = []
  plans = RakutenWebService::Gora::Plan.search(
    maxPrice: budget, # フロント 予算
    playDate: date, # フロント 日付
    areaCode: '8,11,12,13,14',
    NGPlan: 'planHalfRound,planLesson,planOpenCompe,planRegularCompe' # 除外条件(仕様:https://webservice.rakuten.co.jp/api/goraplansearch/)
  )


  # 2. 1 とDB に保存しておいた「ゴルフ場とそのゴルフ場までの所要時間」のデータを使って条件がマッチしたゴルフ場だけをフロント側へ返す
  begin
    plans.each do |plan|
      # DynamoDBに保持している所要時間
      plan_duration = SearchInn.find(golf_course_id: plan['golfCourseId']).send("duration#{departure}")
      # 希望の所要時間より長いものの場合はスキップ
      next if plan_duration > duration

      matched_plans.push(
        {
          # Rakuten APIのレスポンスから必要な情報を取得
          plan_name: plan['planInfo'][0]['planName'],
          plan_id: plan['planInfo'][0]['planId'], # レスポンスの仕様は、公式ドキュメント(https://webservice.rakuten.co.jp/api/goraplansearch/#outputParameter)、
          course_name: plan['golfCourseName'],        # 公式のAPIテストフォーム(https://webservice.rakuten.co.jp/explorer/api/Gora/GoraPlanSearch/)でテストを行ったレスポンスで確認できます
          caption: plan['golfCourseCaption'],
          prefecture: plan['prefecture'],
          image_url: plan['golfCourseImageUrl'],
          evaluation: plan['evaluation'],
          price: plan['planInfo'][0]['price'],
          duration: plan_duration,
          reserve_url_pc: plan['planInfo'][0]['callInfo']['reservePageUrlPC'],
          stock_count: plan['planInfo'][0]['callInfo']['stockCount'],
        }
      )
    end
  rescue # エラーが発生した場合(条件に合致するコースが1件も見つからなかった場合など)はこれをreturn
    return {
      count: 0,
      plans: []
    }
  end

  # 所要時間が短い順にソート
  matched_plans.sort_by! {|plan| plan[:duration]}

  {
    count: matched_plans.count,
    plans: matched_plans
  }
end