# Gem
require 'rakuten_web_service'
require 'google_maps_service'
require 'aws-record'

class SearchInn # 必ず DynamoDB テーブル名 にする
  include Aws::Record
  integer_attr :golf_course_id, hash_key: true
  integer_attr :duration1 # 基準地1からの所要時間
  integer_attr :duration2 # 基準地2からの所要時間
end

module Area
  # 楽天APIで定められているエリアコード
  # 8:茨城県,11:埼玉県,12:千葉県,13:東京都,14:神奈川県
  CODES = ['8', '11', '12', '13', '14']
end

module Departure
  # 基準とする出発地点
  DEPARTURES = {
   1 => '東京駅',
   2 => '横浜駅',
  }
end


# 車での移動時間
def duration_minutes(departure, destination) # 出発地, ゴルフ場
  gmaps = GoogleMapsService::Client.new(key: ENV['GOOGLE_MAP_API_KEY'])
  routes = gmaps.directions(
    departure,
    destination,
    region: 'jp'
  )
  # ルートが存在しないときはnil (東京の離島など)
  return unless routes.first
  # レスポンスから所要時間(秒)を取得
  duration_seconds = routes.first[:legs][0][:duration][:value]
  duration_seconds / 60 # 単位を「分」に
end

# DB保存
def put_item(course_id, durations)
  # 既にDBに同じコースIDのレコードが存在した場合
  return if SearchInn.find(golf_course_id: course_id) # DB名

  duration = SearchInn.new
  duration.golf_course_id = course_id
  duration.duration1 = durations.fetch(1)
  duration.duration2 = durations.fetch(2)
  duration.save
end

# バッチ処理が起動したときに動く
def lambda_handler(event:, context:)
  RakutenWebService.configure do |c|
    c.application_id = ENV['RAKUTEN_APPID']
    c.affiliate_id = ENV['RAKUTEN_AFID']
  end

  # 全エリアに対して
  Area::CODES.each do |code|
    # 1. そのエリアのゴルフ場を楽天APIで全て取得
    1.upto(100) do |page|
      # コース一覧を取得(楽天APIの仕様上、一度に全てのゴルフ場を取得できないのでpageを分けて取得)
      courses = RakutenWebService::Gora::Course.search(areaCode: code, page: page)
      courses.each do |course|
        course_id = course['golfCourseId']
        course_name = course['golfCourseName']
        # ゴルフ場以外の情報(レッスン情報)をスキップ
        next if course_name.include?('レッスン')

        # 2. 所要時間: 出発地点 - 取得したゴルフ場
        durations = {}
        Departure::DEPARTURES.each do |duration_id, departure|
          minutes = duration_minutes(departure, course_name)
          durations.store(duration_id, minutes) if minutes
        end

        # 3. DB保存: コースID, 移動時間
        put_item(course_id, durations) unless durations.empty?
      end

      # 次のページがなくなるまで取得
      break unless courses.next_page?
    end
  end

  { statusCode: 200 }
end
