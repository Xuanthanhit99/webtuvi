# Tarot Native V1 — Android Native QA

**Kết luận: BLOCKED.** Ngày kiểm tra: 2026-10-14 (Asia/Bangkok).

## Baseline và phạm vi

- Branch: `feat/mobile-v1-full-parity`.
- Commit: `d4cbb1c feat(mobile): complete Tarot native animation and functional QA`.
- Working tree sạch khi bắt đầu. Không sửa source/config của mobile, Web, Auth hoặc API.
- Chỉ thêm evidence trong thư mục này. Không commit, push, Actions, merge hoặc deploy.

## Môi trường và khởi chạy

- SDK: `C:/Users/84366/AppData/Local/Android/Sdk`.
- ADB 1.0.41, build 37.0.1-15733141.
- Emulator đang chạy: `emulator-5554`, Pixel_7, Android 15, boot_completed=1.
- Có AVD `Pixel_7` và `Medium_Phone_API_37.0`. Không khởi động lại emulator.
- Expo Go đã cài: 57.0.9; project SDK 57.0.0, package Expo 57.0.19.
- Tạm đặt display 390×844, density 160: screenshot gốc có chiều rộng 390px,
  viewport 390dp. Không resize ảnh sau capture.
- Phiên Expo khác đã dùng port 8081; phiên QA dùng port 8082.
- Lệnh đầu `pnpm --filter @beaconvie/mobile android --port 8082 --localhost`
  trả exit 1 tại bước cài APK. Package Manager sau đó xác nhận APK đã cài.
  Nguyên văn lỗi/stack được giữ trong `expo-android-first-attempt.log`.
- Metro `--localhost` bind IPv6 `::1`, trong khi Expo Go dùng `127.0.0.1`.
  Host `/status` qua localhost trả `packager-status:running`; qua IPv4 không kết nối.
  Expo Go hiện `Uncaught Error: java.io.IOException: Failed to download remote update`.
- Chuyển invocation dev về host LAN mặc định, không sửa config file:
  `pnpm --filter @beaconvie/mobile android --port 8082`.
  Project mở tại `exp://172.23.9.20:8082`; Metro báo
  `Android Bundled 230959ms ... entry.js (2143 modules)`.
- Mệnh Vi đã render Home và tab Tarot khách. Developer-menu overlay của Expo Go
  xuất hiện; chưa thu được ảnh Tarot sạch overlay để nghiệm thu visual.
- Android sau đó báo ANR của Expo Go. Dừng thao tác tương tác, không restart app
  hoặc emulator sau ANR.

## Phát hiện

| Mức độ | Phát hiện | Bằng chứng và ảnh hưởng |
|---|---|---|
| High | Runtime Expo Go ANR | `15-tarot-after-menu-390.png`, `android-last-anr.txt`: `Input dispatching timed out (443b8a3 host.exp.exponent/host.exp.exponent.experience.ExperienceActivity (server) is not responding. Waited 5007ms for FocusEvent(hasFocus=true)).` Chặn tương tác native đáng tin cậy. Chưa xác định nguyên nhân gốc; không quy thành lỗi code Tarot. |
| High | API development không khả dụng | `EXPO_PUBLIC_API_URL` unset; dev fallback `http://localhost:4000`. Không thấy listener port 4000; health request timeout. Không có session/token Tarot thật để kiểm thử draw hoặc persistence. |
| Medium | Thiếu visual master V4.2 đã khóa | Tìm cả file tracked/ignored trong workspace: có `apps/web/e2e/tarot-v42-visual-qa.spec.ts` và ảnh audit `work/production-audit/production/_discover_tarot-390.png`, nhưng không tìm thấy golden artifact/manifest xác nhận master V4.2 đã khóa. Không dùng ảnh audit làm master, không tạo master mới. |
| Low, đã vượt qua | Lỗi setup ban đầu | CLI install exit 1 và mismatch IPv4/IPv6 được ghi log. APK thực tế đã cài; host LAN giúp bundle/render thành công. Đây không còn là blocker cuối. |

Không phát hiện Critical qua phần quan sát được. Điều này không chứng minh phần
luồng bị chặn không có lỗi.

## Ma trận kiểm tra

| Mục | Kết quả |
|---|---|
| SDK / ADB / emulator boot | PASS cho readiness local |
| Bundle Android / render native | Thành công, sau đó runtime ANR — không phải full Native PASS |
| Tab Tarot khách | Quan sát được phía sau Expo developer menu; partial evidence |
| Xáo 78 lá, chọn 1/3, lật tuần tự, luận giải | BLOCKED: runtime ANR + thiếu API/session thật |
| Mặt sau/mặt trước và lá ngược | Chưa kiểm thử native |
| Reduced Motion trước/trong/sau reveal | Chưa kiểm thử native; không thay đổi animator settings |
| History loading/error/empty/retry | Chưa kiểm thử trên native Tarot authenticated |
| Archive / soft delete / restore | Chưa kiểm thử backend/native |
| Accessibility | Dump native ghi nhận label của tab Tarot; chưa chạy TalkBack hoặc kiểm tra reading/card focus. Không kết luận Accessibility PASS |
| So sánh master V4.2 | BLOCKED: thiếu master đã khóa và ảnh Tarot sạch |

Không bật fixture authenticated, không tạo backend mock hoặc tự chọn kết quả bài
để thay thế luồng thật. Jest local trước đây không được dùng làm bằng chứng Native QA.

## Evidence

- `15-tarot-after-menu-390.png`: ảnh native 390×844 xác nhận dialog
  **Expo Go isn't responding** trên project Mệnh Vi/tab Tarot.
- `14-expo-target-390.png`: tab Tarot khách phía sau Expo developer menu;
  foreground xác minh là `host.exp.exponent/.experience.ExperienceActivity`.
- `09-home-390.png`: native Home render; không phải ảnh Tarot/master.
- `02-expo-error-390.png` và `02-expo-error-ui.xml`: lỗi download ở invocation đầu.
- `environment.txt`: version, device, boot, size/density trước cleanup.
- `expo-android-first-attempt.log`, `expo-localhost-attempt.log`,
  `expo-lan-attempt.log`: log khởi chạy.
- `android-last-anr.txt`: chẩn đoán ANR nguyên văn.
- `cleanup.txt`: kết quả cleanup và display sau khi restore.
- `evidence-manifest.json`: kích thước và SHA-256 của các PNG.

**Không dùng `13-tarot-guest-390.png`/XML làm bằng chứng Tarot:** XML ghi nhận
foreground là app khác `com.xuanthanhit99.reality`. Các ảnh bootstrap/dev-menu
khác chỉ ghi lại diễn tiến setup, không phải visual acceptance của Tarot.

## Cleanup và điều kiện tiếp tục

- Force-stop đúng package Expo Go sau ANR; không uninstall ứng dụng.
- Dừng Metro của phiên QA; không dừng phiên Expo khác ở port 8081.
- Restore display về physical 1080×2400, density 420, không còn override.
- Hai reverse mappings của QA đã không còn khi cleanup; lệnh remove trả
  `listener ... not found`. Không retry xóa mapping hoặc thay đổi mapping khác.
- Không có thay đổi source/config trong Git sau QA; chỉ thư mục evidence mới.

Để tiếp tục: cần runtime Android ổn định (xác định nguyên nhân ANR), API development
hoạt động với tài khoản QA/session thật, và đường dẫn/artifact master V4.2 có provenance.
Sau đó chạy lại toàn bộ luồng 1/3 lá, reversal, Reduced Motion, history mutations và
TalkBack trên native rồi capture Tarot sạch ở 390px.

**Không tuyên bố Android Native PASS, Native Visual PASS hoặc Backend E2E PASS.**
