import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css']
})
export class FaqComponent {
  faqs = [
    {
      question: 'Mắt kính tại Eyeconic có bảo hành không?',
      answer: 'Eyeconic cung cấp chính sách bảo hành đa dạng tùy thuộc vào từng loại sản phẩm cụ thể, nhằm đảm bảo quyền lợi tốt nhất cho khách hàng. Vui lòng liên hệ với chúng tôi để nhận được thông tin chi tiết và được hỗ trợ đầy đủ về các điều khoản bảo hành phù hợp với sản phẩm mà bạn đã mua.',
      open: false
    },
    {
      question: 'Eyeconic có loại kính chống ánh sáng xanh không?',
      answer: 'Chúng tôi chuyên cung cấp đa dạng các loại kính chống ánh sáng xanh, được thiết kế đặc biệt phù hợp cho dân văn phòng thường xuyên tiếp xúc với màn hình máy tính và học sinh cần bảo vệ mắt trong quá trình học tập. Những sản phẩm này giúp giảm thiểu tác động của ánh sáng xanh, mang lại sự thoải mái và an toàn cho đôi mắt của bạn suốt cả ngày.',
      open: false
    },
    {
      question: 'Tôi bị cận và muốn làm kính vừa thời trang vừa có độ, Eyeconic có hỗ trợ không?',
      answer: 'Eyeconic hoàn toàn có thể đáp ứng nhu cầu làm kính thời trang theo độ cận của Anh/Chị, với cam kết mang đến sự hài lòng tuyệt đối. Chúng tôi cung cấp nhiều lựa chọn gọng kính thời trang phong phú, phù hợp với mọi phong cách, cùng các chất liệu cao cấp và bền bỉ. Ngoài ra, chúng tôi còn có thể gắn tròng kính theo độ cận chính xác mà Anh/Chị yêu cầu, đảm bảo sự thoải mái và an toàn cho đôi mắt của Anh/Chị trong suốt quá trình sử dụng.',
      open: false
    }
  ];

  @ViewChildren('faqItem') faqItems!: QueryList<ElementRef>;

  toggleFaq(faq: any, index: number) {
    faq.open = !faq.open;

    if (faq.open) {
      setTimeout(() => {
        this.faqItems.toArray()[index].nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 0);
    }
  }
}
