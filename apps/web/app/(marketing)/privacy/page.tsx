import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { MvPage, MvPageHeader, MvSection } from '@/components/ui/mv-page';

export const metadata: Metadata = buildMetadata({
  title: 'Thông báo về quyền riêng tư',
  description: 'Cách Mệnh Vi xử lý dữ liệu của bạn — những gì được thu thập, cách sử dụng, và quyền xuất hoặc xóa dữ liệu của bạn.',
  path: '/privacy',
});

/** A fact only the founder or an authorized legal reviewer can supply — never invented here. See
 * docs/progress/legal-content-completion-final-report.md for the full founder/legal decision
 * register this corresponds to. */
function OwnerPlaceholder({ children }: { children: React.ReactNode }) {
  return <span className="italic text-text-tertiary">[Cần Chủ sở hữu/Pháp lý xác nhận: {children}]</span>;
}

const LAST_UPDATED = '2026-08-22';

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-content px-4 py-16 desktop:px-8">
      <MvPage>
        <MvPageHeader
          eyebrow="Quyền riêng tư"
          title="Thông báo về quyền riêng tư"
          description="Cách Mệnh Vi xử lý dữ liệu của bạn và những công cụ kiểm soát mà bạn có."
        />
        <p className="text-body-sm text-text-tertiary">Cập nhật lần cuối: {LAST_UPDATED}.</p>

        <MvSection title="1. Đơn vị vận hành dịch vụ này">
          <p className="text-body-md text-text-secondary">
            Mệnh Vi (<OwnerPlaceholder>tên pháp nhân và thông tin đăng ký của đơn vị vận hành dịch vụ này</OwnerPlaceholder>,
            có trụ sở tại <OwnerPlaceholder>địa chỉ đăng ký kinh doanh</OwnerPlaceholder>) cung cấp trang web và ứng dụng này. Thông
            báo này giải thích những gì chúng tôi thu thập qua đó, vì sao, và bạn có những quyền kiểm soát gì.
          </p>
        </MvSection>

        <MvSection title="2. Thông tin bạn cung cấp">
          <p className="text-body-md text-text-secondary">Khi bạn tạo tài khoản, chúng tôi thu thập địa chỉ email, tên hiển thị, và mật khẩu
            (chỉ được lưu dưới dạng mã băm mật mã có salt — chúng tôi không bao giờ lưu hoặc có thể khôi phục mật khẩu gốc của bạn).
            Tùy vào tính năng bạn sử dụng, bạn cũng có thể nhập trực tiếp thông tin ngày sinh hoặc thông tin cá nhân vào một tính
            năng Khám phá cụ thể — xem §4.
          </p>
        </MvSection>

        <MvSection title="3. Thông tin do dịch vụ tạo ra">
          <p className="text-body-md text-text-secondary">
            Việc sử dụng sản phẩm tạo ra các bản ghi gắn với tài khoản của bạn: kết quả của bất kỳ phép tính Khám phá nào bạn thực
            hiện, mọi diễn giải AI được tạo cho kết quả đó, lịch sử trò chuyện với Người bạn đồng hành, các ghi chú Ký ức, mục Nhật
            ký, thông báo, và một nhật ký hoạt động cơ bản (ví dụ: bạn đã dùng tính năng nào và khi nào). Đây chính là những bản ghi
            bạn có thể xem lại, xuất, hoặc xóa bất cứ lúc nào — xem §13–§14.
          </p>
        </MvSection>

        <MvSection title="4. Thông tin ngày sinh và các dữ liệu liên quan đến chiêm tinh">
          <ul className="list-disc space-y-2 pl-5 text-body-md text-text-secondary">
            <li><strong>Tử Vi Lá Số</strong> — ngày sinh, giờ sinh, và giới tính, dùng để lập lá số của bạn.</li>
            <li><strong>Bản đồ sao</strong> — ngày sinh, giờ sinh (hoặc lựa chọn giờ sinh gần đúng/không rõ), và nơi sinh. Tính năng
              tìm nơi sinh sẽ gửi nội dung tìm kiếm bạn nhập đến dịch vụ công khai OpenStreetMap Nominatim để xác định tọa độ —
              xem §16.</li>
            <li><strong>Thần số học</strong> — họ tên khai sinh đầy đủ và ngày sinh của bạn.</li>
            <li><strong>Ngũ Hành Phương Đông</strong> — ngày sinh.</li>
          </ul>
          <p className="mt-3 text-body-md text-text-secondary">
            Mỗi kết quả trong số này — bản đồ sao, các con số, các vị trí, con giáp — đều được tính toán bởi một engine xác định,
            không dùng AI, riêng cho từng hệ thống. AI không bao giờ xác định, lựa chọn, hay thay đổi bất kỳ dữ kiện nào trong số
            này; xem §6.
          </p>
        </MvSection>

        <MvSection title="5. Các lượt đọc Tarot">
          <p className="text-body-md text-text-secondary">
            Một lượt rút Tarot (lá bài và chiều bài) được tạo ra bởi một quy trình ngẫu nhiên hóa thật, không dùng AI, và được lưu
            vào lịch sử lượt đọc của bạn cùng với bất kỳ chiêm nghiệm hay diễn giải nào đi kèm, để bạn có thể xem lại sau này.
          </p>
        </MvSection>

        <MvSection title="6. Xử lý bằng AI">
          <p className="text-body-md text-text-secondary">
            Sau khi một kết quả Khám phá (Tarot, Thần số học, Bản đồ sao, Ngũ Hành Phương Đông, hoặc Tử Vi) được tính toán, chúng
            tôi gửi các dữ kiện đã được tính sẵn đến một nhà cung cấp AI để tạo ra một bài tường thuật bằng ngôn ngữ dễ hiểu giải
            thích kết quả đó. AI không bao giờ tự thực hiện phép tính và không thể thay đổi một lá bài, một con số, một vị trí trên
            bản đồ sao, hay một vị trí sao trong lá số Tử Vi — kết quả đầu ra của engine xác định đã được cố định trước khi AI nhìn
            thấy nó. Tính năng Người bạn đồng hành là một cuộc trò chuyện AI riêng biệt, diễn ra liên tục: tin nhắn bạn gửi cho nó
            được gửi đến cùng một nhà cung cấp AI để tạo ra phản hồi.
          </p>
          <p className="mt-3 text-body-md text-text-secondary">
            Nhà cung cấp AI đang hoạt động là một trong số OpenAI, Anthropic, hoặc Google (Gemini), được cấu hình theo từng lần
            triển khai — chỉ một nhà cung cấp hoạt động tại một thời điểm, và một nhà cung cấp giả lập chỉ dùng nội bộ (không bao
            giờ là AI thật, không bao giờ dùng trong môi trường sản xuất) tồn tại chỉ để phục vụ phát triển. Chúng tôi không dùng
            các cuộc trò chuyện hoặc lượt đọc của bạn để huấn luyện mô hình AI nếu không có sự đồng ý rõ ràng, cụ thể và được yêu
            cầu riêng từ bạn.
          </p>
        </MvSection>

        <MvSection title="7. Phân tích dữ liệu sử dụng">
          <p className="text-body-md text-text-secondary">
            Khi tính năng phân tích sản phẩm được bật, chúng tôi ghi lại một tập hợp nhỏ, cố định các thuộc tính sự kiện — tính năng
            bạn đã dùng, đường dẫn trang (không bao giờ là URL đầy đủ, chuỗi truy vấn, hay trang giới thiệu), việc một thao tác có
            thành công hay không, và các tín hiệu tổng quát tương tự. Điều này không bao giờ bao gồm nội dung văn bản tự do, dữ liệu
            ngày sinh, nội dung nhật ký hay tin nhắn, hoặc bất cứ điều gì từ chính một lượt đọc Khám phá. Trước khi bạn đăng nhập,
            các sự kiện được gắn với một mã định danh ngẫu nhiên lưu trên thiết bị của bạn; sau khi đăng nhập, chúng được gắn với
            tài khoản của bạn để chúng tôi hiểu được cách sử dụng thực tế, chứ không suy đoán.
          </p>
        </MvSection>

        <MvSection title="8. Giám sát lỗi">
          <p className="text-body-md text-text-secondary">
            Khi tính năng giám sát lỗi được bật, các báo cáo lỗi kỹ thuật (lỗi gì và ở đâu, không phải dữ liệu của bạn) có thể được
            gửi đến nhà cung cấp dịch vụ giám sát lỗi của chúng tôi để giúp chúng tôi sửa lỗi. Báo cáo được lọc theo một danh sách
            cố định các trường vận hành được phép — nội dung request, cookie, chuỗi truy vấn, và nội dung văn bản tự do không bao
            giờ được đưa vào, bất kể chúng chứa gì.
          </p>
        </MvSection>

        <MvSection title="9. Xác thực, phiên đăng nhập, và dữ liệu bảo mật">
          <p className="text-body-md text-text-secondary">
            Khi đăng nhập, hệ thống cấp một access token có thời hạn ngắn và một refresh token có thời hạn dài hơn, được lưu trong
            cookie bảo mật, không thể truy cập bằng JavaScript (HttpOnly) — không bao giờ ở dạng mà JavaScript trên trang (kể cả mã
            do bên thứ ba chèn vào) có thể đọc được. Chúng tôi sử dụng địa chỉ IP của bạn trong thời gian ngắn để áp dụng giới hạn
            tần suất đối với các lần đăng nhập thất bại liên tiếp, nhằm bảo vệ mọi tài khoản khỏi việc dò mật khẩu tự động.
          </p>
        </MvSection>

        <MvSection title="10. Thanh toán">
          <p className="text-body-md text-text-secondary">
            Các khoản thanh toán Premium được xử lý bởi PayOS. Chúng tôi không bao giờ nhận hay lưu số thẻ hoặc thông tin thanh toán
            đầy đủ của bạn — PayOS xử lý trực tiếp việc đó. Chúng tôi lưu lại bản ghi của chính giao dịch (số tiền, đơn vị tiền tệ,
            trạng thái, và thời điểm) cho mục đích kế toán, kể cả sau khi tài khoản bị xóa; xem §14 và §15.
          </p>
        </MvSection>

        <MvSection title="11. Cộng đồng và nội dung người dùng chia sẻ với người khác">
          <p className="text-body-md text-text-secondary">
            Hiện tại Mệnh Vi chưa có tính năng cộng đồng công khai hay chia sẻ — các lượt đọc, nhật ký, và cuộc trò chuyện của bạn
            chỉ hiển thị với riêng bạn (và với chúng tôi, như mô tả trong thông báo này). Nếu điều này thay đổi trong tương lai,
            thông báo này sẽ được cập nhật trước.
          </p>
        </MvSection>

        <MvSection title="12. Cookie và bộ nhớ cục bộ">
          <p className="text-body-md text-text-secondary">
            Chúng tôi dùng một cookie thiết yếu để giữ bạn đăng nhập một cách an toàn (xem §9). Khi phân tích được bật, một mã định
            danh ẩn danh được lưu trên thiết bị của bạn (xem §7). Chúng tôi không đặt cookie tiếp thị, quảng cáo, hay theo dõi
            xuyên trang.
          </p>
        </MvSection>

        <MvSection title="13. Xuất dữ liệu của bạn">
          <p className="text-body-md text-text-secondary">
            Từ Cài đặt, bạn có thể yêu cầu xuất toàn bộ dữ liệu tài khoản — một tệp duy nhất chứa thông tin tài khoản, các cuộc trò
            chuyện với Người bạn đồng hành, Ký ức, Nhật ký, mọi lượt đọc Khám phá (Tarot, Thần số học, Bản đồ sao, Ngũ Hành Phương
            Đông, Tử Vi Lá Số), Báo cáo Vận mệnh Cá nhân, thông báo, và lịch sử Premium/thanh toán. Các trường nội bộ như mã băm mật
            khẩu của bạn không bao giờ được đưa vào.
          </p>
        </MvSection>

        <MvSection title="14. Xóa tài khoản của bạn">
          <p className="text-body-md text-text-secondary">
            Từ Cài đặt, sau khi xác nhận bằng mật khẩu, bạn có thể xóa tài khoản của mình bất cứ lúc nào. Việc này xóa ngay lập tức
            và không thể khôi phục các cuộc trò chuyện với Người bạn đồng hành, Ký ức, mục Nhật ký, thông báo, và mọi lượt đọc Khám
            phá (Tarot, Thần số học, Bản đồ sao, Ngũ Hành Phương Đông, và Tử Vi Lá Số), cùng với Báo cáo Vận mệnh Cá nhân của bạn,
            và chấm dứt quyền truy cập Premium. Danh tính tài khoản của bạn (email, tên hiển thị) sẽ được xóa sạch và không thể khôi
            phục.
          </p>
          <p className="mt-3 text-body-md text-text-secondary">
            Chúng tôi giữ lại bản ghi các giao dịch thanh toán trước đó sau khi xóa tài khoản, cho mục đích kế toán — bản ghi này
            không còn chứa bất kỳ thông tin hồ sơ cá nhân nào sau khi tài khoản của bạn bị xóa.
          </p>
        </MvSection>

        <MvSection title="15. Thời gian chúng tôi lưu giữ dữ liệu">
          <p className="text-body-md text-text-secondary">
            Nội dung tài khoản và Khám phá được lưu giữ cho đến khi bạn xóa nội dung đó hoặc xóa tài khoản, tùy điều nào đến trước —
            không có thời hạn tự động hết hạn. Một tệp dữ liệu đã xuất chỉ được lưu tạm trong thời gian ngắn (hiện tại là 15 phút)
            trước khi bạn phải yêu cầu xuất một tệp mới. Phiên đăng nhập sẽ hết hạn và cần được làm mới định kỳ.
          </p>
          <p className="mt-3 text-body-md text-text-secondary">
            <OwnerPlaceholder>thời hạn lưu giữ chính xác đối với các bản ghi thanh toán/kế toán được giữ lại sau khi xóa tài khoản,
            và bất kỳ lịch trình lưu giữ nào khác theo yêu cầu của pháp luật về thuế, kế toán, hoặc dịch vụ tài chính hiện hành</OwnerPlaceholder>.
          </p>
        </MvSection>

        <MvSection title="16. Bên xử lý dữ liệu thứ ba">
          <p className="text-body-md text-text-secondary">Các nhà cung cấp bên ngoài sau đây có thể nhận một lượng dữ liệu giới hạn thay mặt chúng tôi, chỉ cho mục đích được mô tả.
            Không phải mọi nhà cung cấp bên dưới đều nhất thiết đang hoạt động tại mọi thời điểm — một số chỉ được bật khi chúng
            tôi đã cấu hình chúng cho môi trường sản xuất.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-body-md text-text-secondary">
            <li><strong>Diễn giải AI/Người bạn đồng hành</strong> — một trong số OpenAI, Anthropic, hoặc Google (Gemini), nhận nội dung cụ thể được mô tả tại §6.</li>
            <li><strong>Tìm kiếm nơi sinh (chỉ dành cho Bản đồ sao)</strong> — OpenStreetMap Nominatim, nhận nội dung tìm kiếm bạn nhập.</li>
            <li><strong>Thanh toán</strong> — PayOS, nhận trực tiếp thông tin thanh toán của bạn (không bao giờ đi qua máy chủ của chúng tôi).</li>
            <li><strong>Gửi email</strong> — một nhà cung cấp dịch vụ email, dùng để xác minh tài khoản, đặt lại mật khẩu, và các email thông báo bạn đã chọn nhận, nhận địa chỉ email và nội dung tin nhắn của bạn.</li>
            <li><strong>Giám sát lỗi</strong> (khi được bật) — nhận dữ liệu kỹ thuật đã được lọc mô tả tại §8.</li>
            <li><strong>Phân tích sản phẩm</strong> (khi được bật) — nhận dữ liệu sự kiện tổng quát mô tả tại §7.</li>
            <li><strong>Lưu trữ máy chủ (Hosting)</strong> — <OwnerPlaceholder>nhà cung cấp hosting/hạ tầng khi được chọn</OwnerPlaceholder>, đơn vị lưu trữ cơ sở dữ liệu nền tảng và vận hành ứng dụng.</li>
          </ul>
        </MvSection>

        <MvSection title="17. Bảo mật">
          <p className="text-body-md text-text-secondary">
            Mật khẩu được lưu dưới dạng mã băm mật mã có salt, không bao giờ ở dạng văn bản thuần. Phiên đăng nhập dùng cookie bảo
            mật, không thể truy cập bằng JavaScript. Các yêu cầu làm thay đổi dữ liệu của bạn cần một mã chống giả mạo (anti-forgery
            token) khớp nhau. Chúng tôi áp dụng giới hạn tần suất cho các endpoint nhạy cảm (đăng nhập, thanh toán, sử dụng AI) để
            giảm lạm dụng. Không biện pháp bảo mật nào là hoàn hảo, và chúng tôi không thể đảm bảo an toàn tuyệt đối — nhưng chúng
            tôi cũng không xem đây là việc làm cho có.
          </p>
        </MvSection>

        <MvSection title="18. Độ tuổi tối thiểu">
          <p className="text-body-md text-text-secondary">
            <OwnerPlaceholder>độ tuổi tối thiểu để tạo tài khoản, và cách xử lý sự đồng ý của phụ huynh nếu sản phẩm hướng đến đối
            tượng vị thành niên tại một số khu vực pháp lý</OwnerPlaceholder>. Hiện tại sản phẩm chưa yêu cầu hoặc xác minh độ tuổi
            của người dùng khi đăng ký.
          </p>
        </MvSection>

        <MvSection title="19. Quyền của bạn">
          <p className="text-body-md text-text-secondary">
            Bạn có thể truy cập, xuất (§13), sửa, hoặc xóa (§14) dữ liệu của mình bất cứ lúc nào từ Cài đặt, mà không cần liên hệ
            với chúng tôi trước. <OwnerPlaceholder>những quyền theo luật định cụ thể nào (ví dụ: theo pháp luật Việt Nam, EU/GDPR,
            hoặc luật bảo vệ dữ liệu hiện hành khác) áp dụng cho bạn, và cách thực hiện bất kỳ quyền nào chưa tự phục vụ được trong
            Cài đặt</OwnerPlaceholder>.
          </p>
        </MvSection>

        <MvSection title="20. Xử lý dữ liệu xuyên quốc gia">
          <p className="text-body-md text-text-secondary">
            Một số nhà cung cấp được liệt kê tại §16 (diễn giải AI, gửi email, giám sát lỗi, phân tích) có thể xử lý dữ liệu bên
            ngoài Việt Nam. <OwnerPlaceholder>các quốc gia cụ thể liên quan, và cơ chế/biện pháp bảo vệ chuyển giao dữ liệu hợp pháp
            áp dụng cho từng trường hợp, khi các nhà cung cấp và hạ tầng lưu trữ được chốt</OwnerPlaceholder>.
          </p>
        </MvSection>

        <MvSection title="21. Thay đổi đối với thông báo này">
          <p className="text-body-md text-text-secondary">
            Nếu chúng tôi thực hiện một thay đổi quan trọng về cách xử lý dữ liệu của bạn, chúng tôi sẽ cập nhật trang này và ngày ở
            đầu trang. Chúng tôi khuyến khích bạn kiểm tra lại định kỳ, đặc biệt trước khi một tính năng mới quan trọng ra mắt.
          </p>
        </MvSection>

        <MvSection title="22. Liên hệ">
          <p className="text-body-md text-text-secondary">
            Các câu hỏi về thông báo này hoặc dữ liệu của bạn có thể được gửi qua <a href="/contact" className="text-insight underline">trang Liên hệ</a>.{' '}
            <OwnerPlaceholder>một địa chỉ hỗ trợ thật, có người theo dõi để thay thế địa chỉ liên hệ tạm thời hiện tại</OwnerPlaceholder>.
          </p>
        </MvSection>
      </MvPage>
    </div>
  );
}
