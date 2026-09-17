import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { MvPage, MvPageHeader, MvSection } from '@/components/ui/mv-page';

export const metadata: Metadata = buildMetadata({
  title: 'Điều khoản dịch vụ',
  description: 'Các điều khoản chi phối việc bạn sử dụng Mệnh Vi.',
  path: '/terms',
});

/** A fact only the founder or an authorized legal reviewer can supply — never invented here. See
 * docs/progress/legal-content-completion-final-report.md for the full founder/legal decision
 * register this corresponds to. */
function OwnerPlaceholder({ children }: { children: React.ReactNode }) {
  return <span className="italic text-text-tertiary">[Cần Chủ sở hữu/Pháp lý xác nhận: {children}]</span>;
}

const LAST_UPDATED = '2026-08-22';

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-content px-4 py-16 desktop:px-8">
      <MvPage>
        <MvPageHeader eyebrow="Điều khoản" title="Điều khoản dịch vụ" description="Các điều khoản chi phối việc bạn sử dụng Mệnh Vi." />
        <p className="text-body-sm text-text-tertiary">Cập nhật lần cuối: {LAST_UPDATED}.</p>

        <MvSection title="1. Dịch vụ">
          <p className="text-body-md text-text-secondary">
            Mệnh Vi là một sản phẩm hỗ trợ chiêm nghiệm và khám phá bản thân. Sản phẩm cung cấp các phần đọc Tarot, Thần số học,
            Bản đồ sao, Ngũ Hành Phương Đông và Tử Vi Lá Số, một Người bạn đồng hành AI có thể trò chuyện, một Nhật ký cá nhân, và
            các tính năng Premium tùy chọn. Dữ kiện nền tảng của mỗi lượt đọc (một lượt rút bài, một con số thần số học, một vị trí
            trên bản đồ sao, một vị trí sao trong lá số Tử Vi) đều được tạo ra bởi một phép tính xác định, không bao giờ do AI bịa
            ra — AI chỉ được dùng để thuật lại hoặc bàn luận về một kết quả đã được tính toán từ trước.
          </p>
        </MvSection>

        <MvSection title="2. Không phải là tư vấn y tế, tâm lý, tài chính hoặc pháp lý">
          <p className="text-body-md text-text-secondary">
            Mệnh Vi được cung cấp nhằm mục đích chiêm nghiệm, giải trí và khám phá bản thân. Đây không phải là dịch vụ tư vấn y tế,
            tâm lý, tài chính hoặc pháp lý, không chẩn đoán hay điều trị bất kỳ tình trạng nào, và không có nội dung nào trong một
            lượt đọc, bản đồ sao, hoặc diễn giải do AI tạo ra được xem là một dự đoán được đảm bảo về các sự kiện hoặc kết quả
            trong tương lai. Nếu bạn đang gặp khủng hoảng, vui lòng liên hệ dịch vụ khẩn cấp tại địa phương hoặc đường dây hỗ trợ
            khủng hoảng trong khu vực của bạn.
          </p>
        </MvSection>

        <MvSection title="3. Nội dung do AI tạo ra">
          <p className="text-body-md text-text-secondary">
            Các diễn giải và phản hồi của Người bạn đồng hành được tạo ra bởi một mô hình AI của bên thứ ba. Văn bản do AI tạo ra
            có thể không chính xác, chưa đầy đủ, hoặc đôi khi sai về giọng điệu hay trọng tâm, mặc dù các dữ kiện xác định mà nó
            đang thuật lại (lá bài, con số, bản đồ sao, ngôi sao) là cố định và không bao giờ bị AI thay đổi. Hãy dùng phán đoán
            của riêng bạn; đừng xem lời thuật của AI là một điều chắc chắn.
          </p>
        </MvSection>

        <MvSection title="4. Điều kiện sử dụng và trách nhiệm tài khoản">
          <p className="text-body-md text-text-secondary">
            Bạn cần có tài khoản để sử dụng hầu hết các tính năng của sản phẩm. Bạn chịu trách nhiệm về tính chính xác của thông
            tin bạn cung cấp, về việc giữ bí mật mật khẩu của mình, và về mọi hoạt động diễn ra dưới tài khoản của bạn.{' '}
            <OwnerPlaceholder>độ tuổi tối thiểu để tạo tài khoản</OwnerPlaceholder>.
          </p>
        </MvSection>

        <MvSection title="5. Sử dụng hợp lệ">
          <p className="text-body-md text-text-secondary">
            Khi tạo tài khoản, bạn đồng ý sử dụng Mệnh Vi một cách thiện chí: không lạm dụng dịch vụ để gây hại cho người khác,
            không cố gắng vượt qua các biện pháp bảo mật hoặc giới hạn tần suất sử dụng, không dùng dịch vụ để tạo hoặc trích xuất
            nội dung vi phạm pháp luật hiện hành, và không cố truy cập vào tài khoản hoặc dữ liệu của người dùng khác.
          </p>
        </MvSection>

        <MvSection title="6. Nội dung của bạn">
          <p className="text-body-md text-text-secondary">
            Bạn giữ quyền sở hữu đối với những gì bạn viết vào sản phẩm — các mục Nhật ký, tin nhắn với Người bạn đồng hành, và bất
            kỳ nội dung chiêm nghiệm nào bạn thêm vào một lượt đọc. Chúng tôi xử lý nội dung đó để cung cấp dịch vụ cho bạn (xem
            Thông báo về quyền riêng tư), và chúng tôi không dùng nội dung đó để huấn luyện mô hình AI nếu không có sự đồng ý rõ
            ràng, cụ thể và được yêu cầu riêng từ bạn. Hiện tại Mệnh Vi chưa có tính năng cộng đồng công khai hay chia sẻ nội dung,
            vì vậy không có gì bạn viết được hiển thị cho người dùng khác.
          </p>
        </MvSection>

        <MvSection title="7. Nội dung và sở hữu trí tuệ của chúng tôi">
          <p className="text-body-md text-text-secondary">
            Tên Mệnh Vi, thiết kế sản phẩm, và các engine tính toán xác định thuộc quyền sở hữu của chúng tôi hoặc được cấp phép
            cho chúng tôi. Hình ảnh lá bài, phương pháp tính toán, và các nguồn tham khảo mà chúng tôi trích dẫn được sử dụng và
            ghi công theo đúng điều khoản riêng của chúng. Bạn không được sao chép, bán lại, hoặc phân phối lại chính sản phẩm này.
          </p>
        </MvSection>

        <MvSection title="8. Premium và thanh toán">
          <p className="text-body-md text-text-secondary">
            Premium là một lượt mua một lần, cấp quyền truy cập trong 30 ngày — đây không phải là gói đăng ký định kỳ, và không tự
            động gia hạn; nếu bạn mua thêm khi Premium đang còn hiệu lực, thời gian truy cập sẽ được cộng dồn từ ngày hết hạn hiện
            tại thay vì tính lại từ đầu. Thanh toán được xử lý qua PayOS; mức giá chính xác tại thời điểm hiện tại được hiển thị
            trong ứng dụng trước khi bạn thanh toán và, do sản phẩm vẫn đang trong giai đoạn định giá ban đầu, mức giá này có thể
            chưa phải là mức giá cuối cùng.
          </p>
          <p className="mt-3 text-body-md text-text-secondary">
            <OwnerPlaceholder>chính sách hoàn tiền — trong trường hợp nào, nếu có, một khoản thanh toán được hoàn lại, và cách yêu cầu hoàn tiền</OwnerPlaceholder>,
            và <OwnerPlaceholder>cách xử lý thuế/hóa đơn áp dụng nếu có</OwnerPlaceholder>.
          </p>
        </MvSection>

        <MvSection title="9. Tính khả dụng của dịch vụ">
          <p className="text-body-md text-text-secondary">
            Chúng tôi cố gắng giữ cho dịch vụ luôn khả dụng và đáng tin cậy, nhưng không đảm bảo quyền truy cập liên tục không
            gián đoạn — một số tính năng có thể tạm thời không khả dụng để bảo trì, và các tính năng phụ thuộc vào AI còn phụ
            thuộc thêm vào việc nhà cung cấp AI bên thứ ba của chúng tôi có sẵn sàng hoạt động hay không.
          </p>
        </MvSection>

        <MvSection title="10. Đình chỉ và chấm dứt tài khoản">
          <p className="text-body-md text-text-secondary">
            Bạn có thể xóa tài khoản của mình bất cứ lúc nào từ Cài đặt (xem Thông báo về quyền riêng tư, mục &ldquo;Xóa tài khoản
            của bạn&rdquo;). Chúng tôi có thể đình chỉ hoặc chấm dứt một tài khoản vi phạm §5 (Sử dụng hợp lệ). Khi làm vậy, chúng
            tôi sẽ cố gắng cho bạn biết lý do.
          </p>
        </MvSection>

        <MvSection title="11. Miễn trừ trách nhiệm">
          <p className="text-body-md text-text-secondary">
            Dịch vụ, bao gồm mọi phép tính, bản đồ sao, lượt đọc, và diễn giải do AI tạo ra, được cung cấp &ldquo;nguyên trạng&rdquo;,
            nhằm mục đích chiêm nghiệm và giải trí, không có bảo đảm rằng bất kỳ kết quả, dự đoán, hoặc diễn giải nào mà dịch vụ
            đưa ra sẽ chính xác, đầy đủ, hoặc phù hợp với một mục đích cụ thể.
          </p>
        </MvSection>

        <MvSection title="12. Giới hạn trách nhiệm pháp lý">
          <p className="text-body-md text-text-secondary">
            <OwnerPlaceholder>nội dung giới hạn trách nhiệm pháp lý cụ thể phù hợp với pháp nhân vận hành và khu vực pháp lý của
            chúng tôi — không được tự ý đặt ra ở đây, vì một điều khoản giới hạn trách nhiệm sai có thể không có hiệu lực thi hành
            hoặc gây hại thực sự</OwnerPlaceholder>.
          </p>
        </MvSection>

        <MvSection title="13. Luật áp dụng và giải quyết tranh chấp">
          <p className="text-body-md text-text-secondary">
            <OwnerPlaceholder>luật áp dụng và cơ quan/khu vực pháp lý giải quyết tranh chấp</OwnerPlaceholder>.
          </p>
        </MvSection>

        <MvSection title="14. Thay đổi đối với các điều khoản này hoặc dịch vụ">
          <p className="text-body-md text-text-secondary">
            Chúng tôi có thể cập nhật các điều khoản này hoặc thay đổi, bổ sung, hoặc loại bỏ các tính năng khi sản phẩm phát
            triển. Nếu chúng tôi thực hiện một thay đổi quan trọng đối với các điều khoản này, chúng tôi sẽ cập nhật ngày ở đầu
            trang này.
          </p>
        </MvSection>

        <MvSection title="15. Liên hệ">
          <p className="text-body-md text-text-secondary">
            Các câu hỏi về những điều khoản này có thể được gửi qua <a href="/contact" className="text-insight underline">trang Liên hệ</a>.
          </p>
        </MvSection>
      </MvPage>
    </main>
  );
}
