import { TU_VI_CORE13_STAR_IDS, TU_VI_MAIN_STAR_IDS, TU_VI_PALACE_ROLES } from '@beaconvie/types/tu-vi-catalog';

const PALACE_ROLES_FROM_MENH = TU_VI_PALACE_ROLES;
const TU_VI_CHINH_TINH_IDS = TU_VI_MAIN_STAR_IDS;

export const TU_VI_SEO_UPDATED_AT = '2026-09-27T00:00:00+07:00';
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
