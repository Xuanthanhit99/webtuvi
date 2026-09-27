'use strict';

/**
 * Shared canonical Tử Vi runtime catalog used by both API calculation code and Web SEO.
 * Keep runtime identifiers here so neither application imports source files from the other.
 */
const TU_VI_PALACE_ROLES = [
  'Mệnh', 'Phụ Mẫu', 'Phúc Đức', 'Điền Trạch', 'Quan Lộc', 'Nô Bộc',
  'Thiên Di', 'Tật Ách', 'Tài Bạch', 'Tử Tức', 'Phu Thê', 'Huynh Đệ',
];

const TU_VI_MAIN_STAR_IDS = [
  'Tử Vi', 'Liêm Trinh', 'Thiên Đồng', 'Vũ Khúc', 'Thái Dương', 'Thiên Cơ', 'Thiên Phủ',
  'Thái Âm', 'Tham Lang', 'Cự Môn', 'Thiên Tướng', 'Thiên Lương', 'Thất Sát', 'Phá Quân',
];

const TU_VI_CORE13_STAR_IDS = [
  'Lộc Tồn', 'Kình Dương', 'Đà La', 'Địa Không', 'Địa Kiếp', 'Hỏa Tinh', 'Linh Tinh',
  'Tả Phù', 'Hữu Bật', 'Văn Xương', 'Văn Khúc', 'Thiên Khôi', 'Thiên Việt',
];

module.exports = { TU_VI_PALACE_ROLES, TU_VI_MAIN_STAR_IDS, TU_VI_CORE13_STAR_IDS };
