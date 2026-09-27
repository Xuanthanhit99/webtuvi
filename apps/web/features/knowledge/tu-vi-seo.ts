import { TU_VI_CORE13_STAR_IDS, TU_VI_MAIN_STAR_IDS, TU_VI_PALACE_ROLES } from '@beaconvie/types/tu-vi-catalog';

const PALACE_ROLES_FROM_MENH = TU_VI_PALACE_ROLES;
const TU_VI_CHINH_TINH_IDS = TU_VI_MAIN_STAR_IDS;

export const TU_VI_SEO_UPDATED_AT = '2026-09-27T21:30:00+07:00';
export const TU_VI_PALACE_SEO_PATH = '/kien-thuc/tu-vi/cung';
export const TU_VI_STAR_SEO_PATH = '/kien-thuc/tu-vi/sao';

const slugMap: Record<string,string> = {
'Mệnh':'menh','Phụ Mẫu':'phu-mau','Phúc Đức':'phuc-duc','Điền Trạch':'dien-trach','Quan Lộc':'quan-loc','Nô Bộc':'no-boc','Thiên Di':'thien-di','Tật Ách':'tat-ach','Tài Bạch':'tai-bach','Tử Tức':'tu-tuc','Phu Thê':'phu-the','Huynh Đệ':'huynh-de',
'Tử Vi':'tu-vi','Liêm Trinh':'liem-trinh','Thiên Đồng':'thien-dong','Vũ Khúc':'vu-khuc','Thái Dương':'thai-duong','Thiên Cơ':'thien-co','Thiên Phủ':'thien-phu','Thái Âm':'thai-am','Tham Lang':'tham-lang','Cự Môn':'cu-mon','Thiên Tướng':'thien-tuong','Thiên Lương':'thien-luong','Thất Sát':'that-sat','Phá Quân':'pha-quan',
'Lộc Tồn':'loc-ton','Kình Dương':'kinh-duong','Đà La':'da-la','Địa Không':'dia-khong','Địa Kiếp':'dia-kiep','Hỏa Tinh':'hoa-tinh','Linh Tinh':'linh-tinh','Tả Phù':'ta-phu','Hữu Bật':'huu-bat','Văn Xương':'van-xuong','Văn Khúc':'van-khuc','Thiên Khôi':'thien-khoi','Thiên Việt':'thien-viet'};

const palaceDescription: Record<string,string> = {
'Mệnh':'bản mệnh, cách một người thể hiện nền tảng cá nhân và điểm xuất phát khi đọc toàn bộ lá số',
'Phụ Mẫu':'mối quan hệ với cha mẹ, bậc sinh thành và nền tảng gia đình',
'Phúc Đức':'phúc phần, nền tảng gia tộc và đời sống tinh thần trong cách đọc truyền thống',
'Điền Trạch':'nhà cửa, nơi ở, môi trường sống và tài sản cố định',
'Quan Lộc':'công việc, sự nghiệp, trách nhiệm và vai trò xã hội',
'Nô Bộc':'bạn bè, đồng nghiệp, cộng sự và những quan hệ hỗ trợ bên ngoài gia đình',
'Thiên Di':'môi trường bên ngoài, việc đi lại và cách tương tác khi bước ra khỏi không gian quen thuộc',
'Tật Ách':'thể trạng và các chủ đề sức khỏe trong ngôn ngữ truyền thống; không thay thế đánh giá y khoa',
'Tài Bạch':'tiền bạc, nguồn lực và cách nhìn về quản lý tài chính; không thay thế tư vấn tài chính',
'Tử Tức':'con cái, thế hệ sau và các mối quan hệ gắn với chủ đề này',
'Phu Thê':'hôn nhân, bạn đời và cách nhìn về quan hệ gắn bó',
'Huynh Đệ':'anh chị em và các mối quan hệ ngang hàng trong gia đình'};

const starGroup: Record<string,string> = Object.fromEntries([
...TU_VI_CHINH_TINH_IDS.map(x=>[x,'chính tinh']),
...TU_VI_CORE13_STAR_IDS.map(x=>[x,'phụ tinh thuộc phạm vi CORE_13 của bộ quy tắc hiện tại']),
]);

export const tuViPalaceSeo = PALACE_ROLES_FROM_MENH.map((name)=>({name,slug:slugMap[name]!,description:palaceDescription[name]!}));
export const tuViStarSeo = [...TU_VI_CHINH_TINH_IDS,...TU_VI_CORE13_STAR_IDS].map((name)=>({name,slug:slugMap[name]!,group:starGroup[name]!}));

export function palaceBySlug(slug:string){return tuViPalaceSeo.find(x=>x.slug===slug);}
export function starBySlug(slug:string){return tuViStarSeo.find(x=>x.slug===slug);}


export type TuViStarSourceContent = {
  placement: string;
  source: string;
  caution?: string;
};

const mainStarOffsets: Record<string, [string, number]> = {
  'Tử Vi': ['Tử Vi tinh hệ', 0],
  'Liêm Trinh': ['Tử Vi tinh hệ', 4],
  'Thiên Đồng': ['Tử Vi tinh hệ', 7],
  'Vũ Khúc': ['Tử Vi tinh hệ', 8],
  'Thái Dương': ['Tử Vi tinh hệ', 9],
  'Thiên Cơ': ['Tử Vi tinh hệ', 11],
  'Thiên Phủ': ['Thiên Phủ tinh hệ', 0],
  'Thái Âm': ['Thiên Phủ tinh hệ', 1],
  'Tham Lang': ['Thiên Phủ tinh hệ', 2],
  'Cự Môn': ['Thiên Phủ tinh hệ', 3],
  'Thiên Tướng': ['Thiên Phủ tinh hệ', 4],
  'Thiên Lương': ['Thiên Phủ tinh hệ', 5],
  'Thất Sát': ['Thiên Phủ tinh hệ', 6],
  'Phá Quân': ['Thiên Phủ tinh hệ', 10],
};

const auxiliaryPlacement: Record<string, TuViStarSourceContent> = {
  'Lộc Tồn': { placement: 'An theo Thiên Can của năm sinh bằng bảng 10 Can; mỗi Can dẫn tới một địa chi cố định.', source: 'VDTTL-1956, trang 9, §8.4 (TUVI-12–24).' },
  'Kình Dương': { placement: 'An tại cung ngay sau Lộc Tồn theo chiều thuận (+1 cung).', source: 'VDTTL-1956, trang 10, §8.6.1 (TUVI-12–24).' },
  'Đà La': { placement: 'An tại cung ngay trước Lộc Tồn theo chiều nghịch (−1 cung).', source: 'VDTTL-1956, trang 10, §8.6.1 (TUVI-12–24).' },
  'Địa Không': { placement: 'Lấy Hợi làm mốc của giờ Tý rồi đếm nghịch tới giờ sinh.', source: 'VDTTL-1956, trang 10, §8.6.2 (TUVI-12–24).' },
  'Địa Kiếp': { placement: 'Lấy Hợi làm mốc của giờ Tý rồi đếm thuận tới giờ sinh.', source: 'VDTTL-1956, trang 10, §8.6.2 (TUVI-12–24).' },
  'Hỏa Tinh': { placement: 'Cung khởi phụ thuộc nhóm Địa Chi năm sinh; chiều đếm tới giờ sinh phụ thuộc tổ hợp âm/dương và giới tính.', source: 'VDTTL-1956, trang 10–11, §8.6.3 (TUVI-12–24).', caution: 'Bản trích xuất đánh dấu một phần bảng khởi cung cần được tái kiểm tra ở độ phóng đại cao; trang này không tự tái dựng bảng đó.' },
  'Linh Tinh': { placement: 'Cung khởi phụ thuộc nhóm Địa Chi năm sinh; chiều đếm tới giờ sinh phụ thuộc tổ hợp âm/dương và giới tính.', source: 'VDTTL-1956, trang 10–11, §8.6.3 (TUVI-12–24).', caution: 'Bản trích xuất đánh dấu một phần bảng khởi cung cần được tái kiểm tra ở độ phóng đại cao; trang này không tự tái dựng bảng đó.' },
  'Tả Phù': { placement: 'Lấy Thìn làm tháng Giêng rồi đếm thuận theo tháng âm lịch.', source: 'VDTTL-1956, trang 11, §8.7 (TUVI-12–24).' },
  'Hữu Bật': { placement: 'Lấy Tuất làm tháng Giêng rồi đếm nghịch theo tháng âm lịch.', source: 'VDTTL-1956, trang 11, §8.7 (TUVI-12–24).' },
  'Văn Xương': { placement: 'Lấy Tuất làm vị trí của giờ Tý rồi đếm nghịch theo giờ sinh.', source: 'VDTTL-1956, trang 11, §8.8 (TUVI-12–24).' },
  'Văn Khúc': { placement: 'Lấy Thìn làm vị trí của giờ Tý rồi đếm thuận theo giờ sinh.', source: 'VDTTL-1956, trang 11, §8.8 (TUVI-12–24).' },
  'Thiên Khôi': { placement: 'An theo Thiên Can năm sinh bằng bảng cặp Thiên Khôi/Thiên Việt 10 Can.', source: 'VDTTL-1956, trang 11, §8.10 (TUVI-12–24).' },
  'Thiên Việt': { placement: 'An theo Thiên Can năm sinh bằng bảng cặp Thiên Khôi/Thiên Việt 10 Can.', source: 'VDTTL-1956, trang 11, §8.10 (TUVI-12–24).' },
};

export function starSourceContent(name: string): TuViStarSourceContent {
  const main = mainStarOffsets[name];
  if (main) {
    const [system, offset] = main;
    const anchor = system === 'Tử Vi tinh hệ' ? 'Tử Vi' : 'Thiên Phủ';
    return {
      placement: offset === 0
        ? `${name} là sao mốc của ${system}; vị trí mốc được xác định trước rồi mới an các sao còn lại trong hệ.`
        : `${name} thuộc ${system}, được an theo chiều thuận ở độ lệch +${offset} cung tính từ ${anchor}.`,
      source: system === 'Tử Vi tinh hệ'
        ? 'VDTTL-1956, trang 7–8, §8.1 (TUVI-08–09).'
        : 'VDTTL-1956, trang 9, §8.2 (TUVI-10–11).',
      caution: system === 'Tử Vi tinh hệ'
        ? 'Bản trích xuất nguồn sơ cấp ghi chiều thuận và đã đánh dấu đây là điểm từng xung đột với nguồn thứ cấp; Mệnh Vi giữ nguyên cảnh báo nguồn thay vì che lấp khác biệt.'
        : undefined,
    };
  }
  return auxiliaryPlacement[name] ?? {
    placement: 'Vị trí sao được lấy từ kết quả engine theo bộ quy tắc đã khóa; trang này không suy diễn thêm quy tắc ngoài nguồn dự án.',
    source: 'Hồ sơ nguồn Tử Vi của Mệnh Vi.',
  };
}
