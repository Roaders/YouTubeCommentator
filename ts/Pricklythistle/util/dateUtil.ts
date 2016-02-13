
module Pricklythistle.Util {

	export class DateUtil {

		static second = 1000;
		static minute = DateUtil.second * 60;
		static hour = DateUtil.minute * 60;
		static day = DateUtil.hour * 24;
		static week = DateUtil.day * 7;
		static month = DateUtil.day * 30;
		static year = DateUtil.day * 365;

		static formatHowLongAgo( inputDate: Date ) : string {
			const elapsed: number = Date.now() - inputDate.getTime();

			var timeUnit: string;
			var timeCount: number;

			if( elapsed < DateUtil.minute ){
				timeUnit = "second";
				timeCount = Math.floor( elapsed / DateUtil.second );
			} else if( elapsed < DateUtil.hour ) {
				timeUnit = "minute";
				timeCount = Math.floor( elapsed / DateUtil.minute );
			} else if( elapsed < DateUtil.day ) {
				timeUnit = "hour";
				timeCount = Math.floor( elapsed / DateUtil.hour );
			} else if( elapsed < DateUtil.week ) {
				timeUnit = "day";
				timeCount = Math.floor( elapsed / DateUtil.day );
			} else if( elapsed < DateUtil.month ) {
				timeUnit = "week";
				timeCount = Math.floor( elapsed / DateUtil.week );
			} else if( elapsed < DateUtil.year ) {
				timeUnit = "month";
				timeCount = Math.floor( elapsed / DateUtil.month );
			} else {
				timeUnit = "year";
				timeCount = Math.floor( elapsed / DateUtil.year );
			}

			timeCount = Math.max(1, timeCount);
			timeUnit = timeCount > 1 ? timeUnit + "s" : timeUnit;

			return timeCount.toString() + " " + timeUnit + " ago";
		}

	}

}
