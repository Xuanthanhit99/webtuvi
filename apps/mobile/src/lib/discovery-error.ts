import { ApiError } from '@/lib/api-client';
const M:Record<string,string>={
PREMIUM_REQUIRED:'Tính năng này cần gói Premium.',
TU_VI_DAILY_LIMIT_REACHED:'Bạn đã dùng hết lượt lập lá số Tử Vi hôm nay.',
TAROT_DAILY_LIMIT_REACHED:'Bạn đã dùng hết lượt Tarot hôm nay.',
TAROT_DAILY_DRAW_ALREADY_TAKEN:'Bạn đã rút lá Tarot hằng ngày hôm nay.',
NATAL_CHART_DAILY_LIMIT_REACHED:'Bạn đã dùng hết lượt lập bản đồ sao hôm nay.',
NUMEROLOGY_DAILY_LIMIT_REACHED:'Bạn đã dùng hết lượt Thần số học hôm nay.',
EASTERN_HOROSCOPE_DAILY_LIMIT_REACHED:'Bạn đã dùng hết lượt xem Tử vi phương Đông hôm nay.',
TUVI_INVALID_DATE_FORMAT:'Ngày sinh chưa đúng định dạng YYYY-MM-DD.',TUVI_INVALID_DATE:'Ngày sinh không hợp lệ.',TUVI_DATE_OUT_OF_RANGE:'Ngày sinh nằm ngoài phạm vi hỗ trợ.',TUVI_DATE_IN_FUTURE:'Ngày sinh không thể ở tương lai.',TUVI_INVALID_TIME_FORMAT:'Giờ sinh chưa đúng định dạng HH:mm.',TUVI_INVALID_TIME:'Giờ sinh không hợp lệ.',
NATAL_CHART_INVALID_DATE_FORMAT:'Ngày sinh chưa đúng định dạng YYYY-MM-DD.',NATAL_CHART_INVALID_CALENDAR_DATE:'Ngày sinh không hợp lệ.',NATAL_CHART_FUTURE_DATE_NOT_ALLOWED:'Ngày sinh không thể ở tương lai.',NATAL_CHART_DATE_TOO_OLD:'Ngày sinh nằm ngoài phạm vi hỗ trợ.',NATAL_CHART_INVALID_TIME_FORMAT:'Giờ sinh chưa đúng định dạng HH:mm.',NATAL_CHART_LOCATION_NOT_RESOLVED:'Không thể xác định địa điểm sinh đã chọn.',GEOCODING_UNAVAILABLE:'Dịch vụ tìm địa điểm tạm thời chưa sẵn sàng.',
NUMEROLOGY_NAME_EMPTY:'Vui lòng nhập đầy đủ họ tên khai sinh.',NUMEROLOGY_NAME_TRANSLITERATION_UNSUPPORTED:'Tên này chưa được hệ thống hỗ trợ để tính số học.',NUMEROLOGY_INVALID_DATE_FORMAT:'Ngày sinh chưa đúng định dạng YYYY-MM-DD.',NUMEROLOGY_INVALID_CALENDAR_DATE:'Ngày sinh không hợp lệ.',NUMEROLOGY_FUTURE_DATE_NOT_ALLOWED:'Ngày sinh không thể ở tương lai.',NUMEROLOGY_DATE_TOO_OLD:'Ngày sinh nằm ngoài phạm vi hỗ trợ.',
EASTERN_HOROSCOPE_INVALID_DATE_FORMAT:'Ngày sinh chưa đúng định dạng YYYY-MM-DD.',EASTERN_HOROSCOPE_INVALID_DATE:'Ngày sinh không hợp lệ.',EASTERN_HOROSCOPE_DATE_OUT_OF_RANGE:'Ngày sinh nằm ngoài phạm vi hỗ trợ.',EASTERN_HOROSCOPE_FUTURE_DATE:'Ngày sinh không thể ở tương lai.'
};
export type DiscoveryErrorKind='premium'|'limit'|'validation'|'network'|'unknown';
export function discoveryError(error:unknown,fallback='Đã có lỗi xảy ra. Vui lòng thử lại.'){if(!(error instanceof ApiError))return {message:fallback,kind:'unknown' as const};const code=String(error.code??'');const message=M[code]??error.message??fallback;const kind:DiscoveryErrorKind=code==='PREMIUM_REQUIRED'?'premium':code.includes('LIMIT')||code.includes('ALREADY_TAKEN')?'limit':code.includes('INVALID')||code.includes('FUTURE')||code.includes('TOO_OLD')||code.includes('NOT_RESOLVED')||code.includes('EMPTY')||code.includes('UNSUPPORTED')?'validation':error.status===0||error.status>=500?'network':'unknown';return {message,kind};}
