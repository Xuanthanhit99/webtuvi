# Mệnh Vi Mobile V1 — Local Development API Recovery

Kết luận: **BLOCKED**. Kiểm tra ngày 2026-10-14, khoảng 15:40–15:42 +07:00.

## Baseline và phạm vi

- Branch: `feat/mobile-v1-full-parity`.
- HEAD: `d4cbb1c feat(mobile): complete Tarot native animation and functional QA`.
- Working tree trước kiểm tra: `?? docs/qa/`. Giữ nguyên bằng chứng đã có.
- Chỉ audit source/config và probe local; không khởi động Docker/backend/Expo, không migration, seed, sửa source hoặc chạy lại Android QA. Không tiếp tục ANR.

## Dependency audit

| Dependency | Cấu hình repository | Kết quả hiện tại |
|---|---|---|
| Node / pnpm | Node >=20; pnpm 11.18.0, root package.json | v22.17.0 / 11.18.0 |
| Docker daemon | docker-compose.yml | Client 29.8.2, context desktop-linux; daemon lỗi bên dưới |
| PostgreSQL | postgres:16-alpine; host localhost:5433; database beaconvie | Không listener 5433; cũng không listener 5432 |
| Redis | redis:7-alpine; host localhost:6380 | Không listener 6380; cũng không listener 6379 |
| Mailpit | SMTP localhost:1025, UI 8025 | Không listener 1025; SMTP cần cho email đăng ký/xác minh, không phải health/Tarot trực tiếp |
| API | API_PORT=4000 | Không listener 4000 |
| Prisma client | apps/api package dependency | Import @prisma/client thành công, PrismaClient export=function; chưa chứng minh schema DB/client đồng bộ |

Các listener được kiểm tra bằng Get-NetTCPConnection -State Listen ở 4000, 5432, 5433, 6379, 6380, 1025. Docker daemon không truy cập được nên không thể xác minh trạng thái container/volume; không kết luận container đã bị xóa.

PrismaService.onModuleInit phải kết nối PostgreSQL (apps/api/src/prisma/prisma.service.ts). RedisService tạo kết nối Redis; throttler sử dụng Redis (apps/api/src/redis/redis.service.ts, apps/api/src/app.module.ts). /health/ready yêu cầu cả DB SELECT 1 và Redis PING thành công (apps/api/src/health/health.controller.ts:23–31). Liveness đơn thuần không chứng minh Tarot hoạt động.

Tarot cần schema migrations đầy đủ, 78 TarotCard (apps/api/src/tarot/selection/tarot-selection.service.ts:45–46), spreads tham chiếu (apps/api/src/tarot/record/tarot-record.service.ts:89–91), bảng TarotSelectionClaim cho token một lần (cùng file:106,129; migration 20261008172000_tarot_selection_claims). User/session development hợp lệ cần cho endpoint được bảo vệ; quyền premium/giới hạn lượt vẫn được backend áp dụng. AI interpretation có thể dùng DEFAULT_AI_PROVIDER=mock trong development, không cần key AI thật. Email dùng Mailpit nếu cần tạo/xác minh tài khoản local; không sử dụng tài khoản production. PayOS/analytics/geocoding không cần cho health và luồng Tarot với mock, không có outbound provider call trong audit này.

## Environment safety

- Không tồn tại .env ở root hoặc apps/api/.env; tìm file .env/.env.local không có kết quả.
- Các biến NODE_ENV, DATABASE_URL, REDIS_URL, API_PORT, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, CSRF_SECRET, EXPO_PUBLIC_API_URL đều absent ở Process/User/Machine.
- Chỉ đọc template apps/api/.env.example và .env.test.example. Template development trỏ DB localhost:5433, Redis localhost:6380, NODE_ENV=development; không lấy hoặc kết nối DB/Redis production.
- ConfigModule đọc môi trường và appConfig gọi validateEnv (apps/api/src/app.module.ts:44; apps/api/src/config/configuration.ts:10–11). Required: API_BASE_URL, FRONTEND_URL, CORS_ORIGINS, DATABASE_URL, REDIS_URL, ba secrets >=32 ký tự, AUTH_COOKIE_DOMAIN, EMAIL_FROM; API_PORT mặc định 4000. Provider thật cần key tương ứng, mock không cần. Không tạo .env trong task này vì dependency thiếu.
- apps/api/node_modules và root node_modules tồn tại. Không chạy install/generate/build/test.

## Sanitized probe evidence

```text
docker version
Client Version: 29.8.2
Context: desktop-linux
Error response from daemon: Docker Desktop is unable to start

http://127.0.0.1:4000/health/live HTTP=NONE error=Unable to connect to the remote server
http://127.0.0.1:4000/health/ready HTTP=NONE error=Unable to connect to the remote server

adb devices
emulator-5554 device
adb -s emulator-5554 shell 'timeout 5 nc -4 -z -w 3 10.0.2.2 4000'
nc: connect: Connection refused
Android probe exit=1
```

HTTP=NONE nghĩa là không nhận được HTTP status, không phải 503. Android probe chỉ kiểm tra TCP, không chứng minh endpoint HTTP; HTTP từ emulator chưa thể xác minh khi không có server. Không restart emulator hay chạy Expo.

## Phương án tối thiểu trước recovery tiếp theo

1. Khôi phục Docker Desktop daemon. Sau đó dùng Compose development có sẵn (README.md:38), kiểm tra PostgreSQL/Redis/Mailpit health và xác nhận URL chỉ trỏ local. Task này dừng trước thao tác tạo/khởi động dependency theo yêu cầu.
2. Tạo apps/api/.env development từ template, sinh ba secrets local riêng; dùng localhost:5433/beaconvie và localhost:6380, AI mock. Không tái sử dụng secrets hoặc dịch vụ production.
3. Kiểm tra migration status/schema và số cards/spreads bằng thao tác đọc. Nếu thiếu migrations/reference data, trình phương án cho database development cụ thể trước khi migrate/seed; không chạy prisma:deploy vì script gộp migration và seed. Hiện chưa thể xác định migration nào thiếu do DB không truy cập được.
4. Khi mọi dependency và schema/data sẵn sàng, chạy pnpm dev:api theo README.md:55; yêu cầu cả health/live và health/ready trả 200, rồi kiểm tra HTTP từ emulator qua 10.0.2.2:4000.
5. Phiên Expo development có thể đặt process-only EXPO_PUBLIC_API_URL=http://10.0.2.2:4000 trước lệnh dev:mobile. apps/mobile/src/lib/api-client.ts:3–13 đọc biến này, cho phép HTTP khi __DEV__, yêu cầu HTTPS ngoài development. Không hard-code hoặc sửa production. Chưa đặt biến/chạy Expo trong task này.

Không có API READY, Backend E2E PASS hoặc Native Visual PASS. Bằng chứng gốc giữ nguyên; báo cáo này là artifact QA mới duy nhất của task.
